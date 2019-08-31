import pickle
import pandas as pd
import numpy as np
from plotnine import *
import os
import sys

out_dir = 'plot_data_' + sys.argv[1]

with open(os.path.join(out_dir, 'colplot.pic'), 'rb') as f:
    df = pickle.load(f)

print(df)

maxing = True
if maxing:
    # * max()
    df1 = df.copy()
    df1 = df1.loc[df['type'] == 'workload']
    df1 = df1.groupby(['topo','env','type']).sum().reset_index()
    idx = df1.groupby(['topo','type'], as_index=True)['d_t_cpu'].idxmax()
    # df1 = df1.loc[df1['type']=='workload']
    df1 = df1.loc[idx].reset_index()
    df1 = df1[['topo','env']]
    print(df1)
    df1['tmp'] = df1['topo'].astype(str) + df1['env'].astype(str)
    df['tmp'] = df['topo'].astype(str) + df['env'].astype(str)
    df = df.loc[df['tmp'].isin(df1['tmp'])]
    print(df)

else:
    # * mean()
    df = df.groupby(['topo','type','idx']).mean().reset_index()

# * suite

df['process'] = df.apply(lambda row: '%s %d' % (row['type'], row['idx']), axis=1)


def f(row):
    tmp = df.loc[row['topo']==df['topo'],'idx']
    return tmp.max() - row['idx']


# df['idx'] = df.apply(f, axis=1)
df['order'] = [e[::-1] for e in df['topo']]
df['cores'] = [int((e[::-1].split(')',1)[0])[::-1]) for e in df['topo']]
print(df)


def g(a):
    return (a[::-1].split(')',1)[0], a.count('['), a)


l = sorted(df['topo'].unique(),key=g)
df['v'] = [l.index(e) for e in df['topo']]
df = df.sort_values(by='v').reset_index()


def h(x):
    print(x)
    return ['8' not in str(x) and '7' not in str(x) for x in x['topo']]

df = df.loc[df['v'] < 65].drop('level_0', axis=1).reset_index().copy()
l = sorted(df['topo'].unique(), key=g)
df['topo'] = pd.Categorical(df['topo'], categories=l, ordered=True)
df['on_vm'] = ['pm' if np.isnan(e) else str(int(e)) for e in df['on_vm']]



print(df)

p = ggplot(df.loc[(df['type']!='vm') & (df['type']!='monitoring')])
p += geom_bar(aes('topo','cores'), stat='unique', width=1.0, alpha=0.7)
# p += geom_col(aes('topo', 'd_t_cpu', color='factor(idx)'),
#               df.loc[(df['type']=='vm')],
#               position=position_stack(reverse=True),
#               inherit_aes=False,
#               show_legend=True,
#               width=0.8,
#               fill='black')


p += geom_col(aes('topo', 'd_t_cpu', fill='factor(on_vm)', color='factor(idx)'),
              # df.loc[(df['type']!='vm') & (df['type']!='monitoring')],
              position=position_stack(reverse=True),
              width=0.7,
              inherit_aes=False,
              show_legend=True,
              size=2)
p += scale_fill_hue(l=0.45, s=0.9, name='localisation')
p += scale_color_grey(0.9, 0.0, name='index workloads')
# p += scale_fill_hue(l=0.1)
# p += scale_fill_hue()
# p += scale_y_continuous(trans="reverse")

p += xlab('')
p += ylab('consommation de ressources cpu (coeurs)')
# p += xlim('( [ oo ]1 )1','( ooo [ ooooooo ]6 [ ooooooo ]6 [ oooooo ]6 )6')
# p+= scale_x_discrete(breaks=list(df['topo'])[:-10], limits=list(df['topo'])[:-10], drop=True)
# p+= scale_x_discrete(drop=False)
# p += coord_cartesian(xlim=(0,40))
p += scale_x_discrete(labels=lambda lst: ["" for x in lst])
p += theme(
    plot_title=element_text(size=15.0),
    text=element_text(size=20.0),
    axis_text_x=element_text(rotation=-35, hjust=0.0, vjust=1.0)
)
p.save(os.path.join(out_dir, 'colplot_max.png'), height=21.60, width=38.40, limitsize=False)
# p.save(os.path.join(out_dir, 'colplot.png'), height=10.80, width=19.20)
