import click
import logging
import yaml
import csv
import sys
import os
import json
import pandas as pd
import numpy as np
from pprint import pprint
from plotnine import *

# logging.basicConfig(level=logging.DEBUG)
from io import StringIO

@click.group()
def cli():
    pass


def load_config(file_path):
    """
    Read configuration from a file in YAML format.
    :param file_path: Path of the configuration file.
    :return:
    """
    with open(file_path) as f:
        configuration = yaml.safe_load(f)
    return configuration

# @cli.command(help='''compute things about ngrams using logs given as input
# - count: count the number of unique ngrams
# - print: print ngrams representing the file
# - count_occ : count the number of occurence of each ngram''')
# @click.option("-n",
#               help="the size of the ngram")
# @click.argument("operation")
# def ngram(operation, n):
#     if operation=='print':

def get_table_from_stream(columns, in_path=None):
    if in_path==None:
         return pd.read_csv(sys.stdin, sep=' ', names=columns)

def get_table_from_json(in_path):
    with open(in_path, "r") as read_file:
        value = json.load(read_file)
        names = ['ngram','occ']
        formats = ['|U16','int'] 
        dtype = dict(names = names, formats=formats)
        return pd.DataFrame(np.array(list(((x[0],len(x[1])) for x in value['set']['map'].items())),dtype=dtype),columns=['ngram','occ'])

def plot_line(df):
    print(df.dtypes)
    p = ggplot(df,aes('n','count',group='ori'))
    p+= geom_line()
    p+= geom_point()
    return p


def plot_dist(df):
    print(df.dtypes)
    p = ggplot(df,aes('idx','occ'))
    # p+= geom_bar(stat='identity',position = "dodge",width=1)
    p+= geom_area(fill='black')
    return p


def plot_dist2(df):
    print(df.dtypes)
    p = ggplot(df,aes('idx'))
    # p+= geom_bar(stat='identity',position = "dodge",width=1)
    p+= geom_area(aes('idx','pocc'),fill='black',alpha=0.5)
    p+= geom_area(aes('idx','tocc'),fill='red',alpha=0.5)
    # p+= geom_point(aes('idx','pocc_zero'),fill='black',alpha=0.5,size=10)
    p+= geom_point(aes('idx','tocc_zero'),fill='red',alpha=0.3,size=10)
    return p


def plot_multi_dist(df):
    print(df.dtypes)
    p = ggplot(df,aes('idx'))
    p+= geom_area(aes('idx','pocc'),fill='black',alpha=0.5)
    p+= geom_area(aes('idx','tocc'),fill='red',alpha=0.5)
    # p+= geom_point(aes('idx','pocc_zero'),fill='black',alpha=0.5,size=10)
    p+= geom_point(aes('idx','tocc_zero'),fill='red',shape='^',alpha=0.7,size=10)
    p+= facet_wrap('package')
    return p


@cli.command(help='''plot number of distinct ngrams over the value of n.
take its input as csv format''')
@click.option("-o", "--output",
              required=True,
              help="output file")
@click.argument("style", nargs=1)
@click.argument('paths', nargs=-1)
def ngram(style,output, paths):
    dfs = []
    for p in paths:
        if os.path.splitext(p)[1] == '.json':
            dfs.append(get_table_from_json(p))
        else:
            dfs.append(get_table_from_stream(['ori','n','count']))

    df = pd.concat(dfs, keys=range(len(dfs)))
    if style=='line':
        plot_line(df).save(output)
    if style=='distribution':
        plot_line(df).save(output)


@cli.command(help='''plot distribution of ngrams for a given n.
take its input as list of file in Javier json format''')
@click.option("-o", "--output",
              required=True,
              help="output file")
@click.argument("style", nargs=1)
@click.argument('paths', nargs=-1)
def ngram_dist(style,output, paths):
    dfs = []
    for p in paths:
        if os.path.splitext(p)[1] == '.json':
            dfs.append(get_table_from_json(p))
        else:
            dfs.append(get_table_from_stream(['ori','n','count']))

    df = pd.concat(dfs, keys=range(1,len(dfs)+1),names=['key'])
    df.reset_index(level='key',inplace=True)
    df['ngram'] = df['ngram'].astype(str)
    df = df.groupby(['ngram']).mean().reset_index()
    # df = df[df.occ > 100]
    df = df.sort_values(by=['occ']).reset_index(drop=True)
    print(df)
    df = df[-3000:]
    my_list = df['ngram'].to_list()
    from pandas.api.types import CategoricalDtype
    ngram_cat = CategoricalDtype(categories=reversed(my_list), ordered=True)
    df['ngram'] = df['ngram'].astype(str).astype(ngram_cat)
    df['idx'] = np.flip(df.index.astype(int))
    if style=='line':
        p = plot_dist(df)
        p+= scale_y_continuous(trans='log2')
        # p += scale_x_discrete(labels=lambda lst: ["" for x in lst])
        p += theme(
            axis_text_x=element_text(rotation=-35, hjust=0.0, vjust=1.0)
        )
        p.save(output,height=21.60, width=38.40, limitsize=False)

@cli.command(help='''plot distribution of ngrams for a given n.
take its input as list of file in Javier json format''')
@click.option("-o", "--output",
              required=True,
              help="output file")
@click.argument("style", nargs=1)
def ngram_dist_precomp(style,output):
    df = pd.read_csv(sys.stdin, sep=' ', names=['pocc','tocc'])
    df['idx'] = df.index
    # df['pocc_zero'] = df['pocc']==0
    df['tocc_zero'] = df['tocc']==0
    df = df[:2000]
    # df['pocc_zero'].replace(False, np.nan, inplace=True)
    df['tocc_zero'].replace(False, np.nan, inplace=True)
    # df['pocc_zero'].replace(True, 50, inplace=True)
    df['tocc_zero'].replace(True, .9, inplace=True)
    print(df)
    if style=='line':
        p = plot_dist2(df)
        p+= scale_y_continuous(trans='log2')
        # p+= scale_x_continuous(trans='log2')
        # p += scale_x_discrete(labels=lambda lst: ["" for x in lst])
        p += theme(
            axis_text_x=element_text(rotation=-35, hjust=0.0, vjust=1.0)
        )
        p.save(output,height=21.60, width=38.40, limitsize=False)


@cli.command(help='''plot distribution of ngrams per packages.
take its input from stdin as csv (spaces) format''')
@click.option("-o", "--output",
              required=True,
              help="output file")
@click.option("--named-fcts",
              is_flag=True,
              help="print fcts name in x axis")
@click.argument("style", nargs=1)
def multi_dist(style,output, named_fcts):
    df = get_table_from_stream(['package','fct','pocc','tocc'])
    df['pocc']=pd.to_numeric(df['pocc'])
    df['tocc']=pd.to_numeric(df['tocc'])

    def order_pocc(x):
        x = x.sort_values(["pocc","tocc"], ascending = [False, True]).reset_index(drop=True)
        # x = x.groupby(['package']).apply(order_tocc).reset_index(drop=True)
        x['idx'] = range(len(x))
        return x.head(100)

    df = df.groupby(['package']).apply(order_pocc).reset_index(drop=True)
    # df['pocc_zero'] = df['pocc']==0
    df['tocc_zero'] = df['tocc']==0
    df['pocc'].replace(0, 1, inplace=True)
    df['tocc'].replace(0, 1, inplace=True)
    # df['pocc_zero'].replace(False, np.nan, inplace=True)
    df['tocc_zero'].replace(False, np.nan, inplace=True)
    # df['pocc_zero'].replace(True, .5, inplace=True)
    df['tocc_zero'].replace(True, .9, inplace=True)
    print(df)
    if style=='line':
        p = plot_multi_dist(df)
        p+= scale_y_continuous(trans='log2')
        p+= theme(
            axis_text_x=element_text(rotation=-35, hjust=0.0, vjust=1.0)
        )
        p.save(output,height=21.60, width=38.40, limitsize=False)


@cli.command(help='''create a bitmap from traces''')
@click.option("-o", "--output",
              required=True,
              help="output file")
@click.argument("style", nargs=1)
def bitmap_repr(style,output):
    import matplotlib.pyplot as plt
    # import matplotlib.cm as cm
    # import numpy as np
    # data = np.random.rand(1,1)
    # data[0,0] = .5
    # data = np.array([[1,.5,1,.5]])
    # print(data)
    v = 1
    data = []
    a = []
    i = 0
    width = 1000
    d = {}
    for line in sys.stdin:
        if line not in d:
            d[line] = v = v if v < 100 else 1
            v = v + 1
        a.append(d[line])
        i = i + 1
        if i == width:
            data.append(a)
            a = []
            i = 0
    if i != 0:
        data.append(a+([0]*(width-len(a))))
    print(len(d),v)
    plt.imsave(output, data,cmap=style)#data.reshape(4,1),cmap='jet')#np.array(data).reshape(1,1))

@cli.command(help='''create a bitmap from traces''')
@click.option("-o", "--output",
              required=True,
              help="output file")
@click.argument("style", nargs=1)
def precomputed_bitmap_repr(style,output):
    import matplotlib.pyplot as plt
    # import matplotlib.cm as cm
    # import numpy as np
    # data = np.random.rand(1,1)
    # data[0,0] = .5
    # data = np.array([[1,.5,1,.5]])
    # print(data)
    v = 1
    data = []
    a = []
    i = 0
    width = 13
    for line in sys.stdin:
        a.append(float(line)/1000000)
        i = i + 1
        if i == width:
            data.append(a)
            a = []
            i = 0
    if i != 0:
        data.append(a+([0]*(width-len(a))))
    plt.imsave(output, data,cmap=style)#data.reshape(4,1),cmap='jet')#np.array(data).reshape(1,1))

if __name__ == '__main__':
    cli()