
def gen_trace(n,acc=[]):
    if n<=0:
        return ''.join(acc)
    elif len(acc)==0:
        return gen_trace(n-1,['a'])
    elif len(acc)%2==0:
        return gen_trace(n-1,[chr(ord(acc[-1])+1)]+acc)
    else:
        return gen_trace(n-1,acc+[chr(ord(acc[0])+1)])

assert(gen_trace(0)=='')
assert(gen_trace(1)=='a')
assert(gen_trace(2)=='ab')
assert(gen_trace(3)=='cab')
assert(gen_trace(4)=='cabd')
assert(gen_trace(5)=='ecabd')
print(gen_trace(10))
print(chr(ord('a')-1))

trace = gen_trace(101)

def ngram(trace,n):
    r = set()
    for i in range(len(trace)-n+1):
        r.add(trace[i:i+n])
    return r

print(list(ngram(trace,3)))

print(list(filter(lambda x: 'a' in x, ngram(trace,4))))

def ngram_containing_basic(trace,n,v='a'):
    r = set()
    for i in range(n+1):
        r = r.union(filter(lambda x: v in x, ngram(trace,i)))
    return r


def path2shift(moves):
    p = 0
    n = 0
    for m in moves:
        if m=='p':
            p=p-1
        elif m=='n':
            n=n+1
        else:
            raise Exception(m+' is not a valid move')
    return (p,n)

def ngram_containing_tree_adv(trace,n,v='a',l=[]):
    if len(l)>=n:
        r = list()
        for s in l:
            # r = r.union(map(lambda x:(path2shift(x[0]),x[1]),s))
            # r = r.union(s)
            r+=map(lambda x:x[1],s)
        return r
    elif len(l)==0:
        return ngram_containing_tree_adv(trace,n,v=v,l=[set([('','a')])])
    else:
        prev = l[-1]
        r = list()
        for node in prev:
            pos = path2shift(node[0])
            # if (node[0]+'p')[-2:]=='np' or (node[0]+'n')[-2:]=='pn':
            #     print(len(l),pos,node[0])
            # if pair   and 
            # if impair and 
            if len(l)<2 or pos[0]-1==0 or pos[1]==0 or (len(l)%2==1 and (node[0]+'p')[-2:]=='np'):
                r.append((node[0]+'p',trace[trace.index(v)+pos[0]-1]+node[1]))
            if len(l)<2 or pos[0]==0 or pos[1]+1==0 or (len(l)%2==0 and (node[0]+'n')[-2:]=='pn'):
                r.append((node[0]+'n',node[1]+trace[trace.index(v)+pos[1]+1]))
        return ngram_containing_tree_adv(trace,n,v=v,l=l+[r])

        
def ngram_containing_tree_naive(trace,n,v='a',l=[]):
    if len(l)>=n:
        r = list()
        for s in l:
            # r = r.union(map(lambda x:(path2shift(x[0]),x[1]),s))
            # r = r.union(s)
            r+=map(lambda x:x[1],s)
        return r
    elif len(l)==0:
        return ngram_containing_tree_naive(trace,n,v=v,l=[set([('','a')])])
    else:
        prev = l[-1]
        r = list()
        for node in prev:
            pos = path2shift(node[0])
            r.append((node[0]+'p',trace[trace.index(v)+pos[0]-1]+node[1]))
            r.append((node[0]+'n',node[1]+trace[trace.index(v)+pos[1]+1]))
        return ngram_containing_tree_naive(trace,n,v=v,l=l+[r])


_size = 51
print(len(list(ngram_containing_basic(trace,_size))))
# print(len(list(ngram_containing_tree_naive(trace,_size))))
print(len(list(ngram_containing_tree_adv(trace,_size))))


# print(list(ngram_containing_basic(trace,_size)))
# print(list(ngram_containing_tree_adv(trace,_size)))