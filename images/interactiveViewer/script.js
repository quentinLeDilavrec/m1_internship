const vscode = (() => {
  try { return acquireVsCodeApi() }
  catch (e) { return { postMessage: (...x) => console.log(...x), dummy: true } }
})()

let width = window.innerWidth,
  height = window.innerHeight,
  margin = { top: 20, right: 10, bottom: 20, left: 10 };

const settings_register = {}

function toTree(data) {
  if (Array.isArray(data)) {
    const tmp = {}
    data.forEach(x => {
      const name = '' + x.sl + ':' + x.sc
      if (x.params !== undefined) {
        tmp[name] = tmp[name] || { name: name, sl: x.sl, sc: x.sc, el: x.el, ec: x.ec, children: [] }
        tmp[name].children.push({ ...x, name: x.params === null ? "null" : x.params })
      } else {
        tmp[name] = { ...x, name: name }
      }
    })
    const r2 = []
    for (const key in tmp) {
      if (tmp.hasOwnProperty(key)) {
        r2.push(tmp[key])
      }
    }
    r2.sort((a, b) => a.sl === b.sl ? a.sc - b.sc : a.sl - b.sl)
    return r2
  }
  const r = {};
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const element = data[key];
      const i = key.indexOf('/')
      if (i === -1) {
        r[key] = element
        continue;
      }
      const prefix = key.slice(0, i);
      const suffix = key.slice(i + 1);
      r[prefix] = r[prefix] || {}
      r[prefix][suffix] = element;
    }
  }
  const r2 = []
  for (const key in r) {
    if (r.hasOwnProperty(key)) {
      const element = r[key];
      r2.push({ name: key, children: toTree(element) })
    }
  }
  return r2;
}

function get_node_value(data) {
  if (data.params) {
    return get_node_value(data.parent)
  } else if (!data.children || data.children[0].params) {
    return get_node_value(data.parent) + ':' + data.sl + ':' + data.sc + ':' + data.el + ':' + data.ec
  } else if (data.parent && data.parent.parent) {
    return get_node_value(data.parent) + '/' + data.name
  } else {
    return data.name
  }
  // return !data.children || data.children.params ?
  //   data.params || data.name + ':' + data.sl + ':' + data.sc
  //   : data.parent ?
  //     (get_node_value(data.parent) + '/' + data.name)
  //     : 'gutenberg'
}

function vscode_action(data) {
  if (window.moving_mode === 'zoom' && data.children) {
    console.log('zoom', data)
    return 'zoom'
  } else {
    const position = get_node_value(data)
    if (window.moving_mode === 'jump to decl') {
      vscode.postMessage({
        command: 'jump to decl',
        position: position,
        parameter: data.params,
        type: data.params ? 'params' : data.sl ? 'function' : 'container'
      })
      console.log(`go to ${position}`);
    } else if (window.moving_mode === 'show context') {
      vscode.postMessage({
        command: 'show context',
        parameter: data.params,
        position: position,
        type: data.params ? 'params' : data.sl ? 'function' : 'container'
      })
      console.log(`show ${position}, ${data.params}`);
    }
  }
}

const basic_accumulators_exe_order = [
  'max depth',
  'count',
  'count ignore params',
  'min tocc',
  'max tocc',
  'sum pocc',
  'sum tocc',
  'zero tocc count',
  'zero tocc sum',
  'not zero tocc sum',
  'count production ignore params',
  'zero sum tocc ignore params',
  'zero count tocc ignore params',]

const basic_accumulators = {
  'max depth': {
    init: data => 0,
    inc: (acc, curr) => Math.max(acc, ...(curr.map(x => x['max depth']))) + 1
  },
  'count': {
    init: data => data.children ? 0 : 1,
    inc: (acc, curr) => curr.reduce((acc, x) => acc + x['count'], acc)
  },
  'count ignore params': {
    init: data => data.children && data.children[0] && data.children[0].params ? 1 : data.children ? 1 : 0,
    inc: (acc, curr) => curr[0] && curr[0].params ? acc : curr.reduce((acc, x) => acc + x['count ignore params'], acc)
  },
  'min tocc': {
    init: data => data.tocc || 0,
    inc: (acc, curr) => Math.min(acc, ...curr.map(x => x['min tocc']))
  },
  'max tocc': {
    init: data => data.tocc || 0,
    inc: (acc, curr) => Math.max(acc, ...curr.map(x => x['max tocc']))
  },
  'sum pocc': {
    init: data => data.pocc || 0,
    inc: (acc, curr) => curr.reduce((acc, x) => acc + x['sum pocc'], acc)
  },
  'sum tocc': {
    init: data => data.tocc || 0,
    inc: (acc, curr) => curr.reduce((acc, x) => acc + x['sum tocc'], acc)
  },
  'zero tocc count': {
    init: data => data.tocc === 0 && !data.children ? 1 : 0,
    inc: (acc, curr) => curr.reduce((acc, x) => acc + x['zero tocc count'], acc)
  },
  'zero tocc sum': {
    init: data => data.tocc === 0 && !data.children ? data.pocc : 0,
    inc: (acc, curr) => curr.reduce((acc, x) => acc + x['zero tocc sum'], acc)
  },
  'not zero tocc sum': {
    init: data => data.tocc !== 0 && !data.children ? data.pocc : 0,
    inc: (acc, curr) => curr.reduce((acc, x) => acc + x['not zero tocc sum'], acc)
  },
  'zero sum tocc ignore params': {
    init: data => data.children && data.children[0] && data.children[0].params ? (data['sum tocc'] === 0 ? data['sum pocc'] : 0) : (data['sum tocc'] === 0 && !data.children ? data['sum pocc'] : 0),
    inc: (acc, curr) => curr[0] && curr[0].params ? acc : curr.reduce((acc, x) => acc + x['zero sum tocc ignore params'], acc)
  },
  'zero count tocc ignore params': {
    init: data => data.children && data.children[0] && data.children[0].params ? (data['sum tocc'] === 0 ? 1 : 0) : (!data.children && data['sum tocc'] === 0 ? 1 : 0),
    inc: (acc, curr) => curr[0] && curr[0].params ? acc : curr.reduce((acc, x) => acc + x['zero count tocc ignore params'], acc)
  },
  'count production ignore params': {
    init: data => data.children && data.children[0] && data.children[0].params ? (data['sum pocc'] > 0 ? 1 : 0) : (!data.children && data['sum pocc'] > 0 ? 1 : 0),
    inc: (acc, curr) => curr[0] && curr[0].params ? acc : curr.reduce((acc, x) => acc + x['count production ignore params'], acc)
  }
}

// Does not keep scale in nodes, can't compare scale of nodes only leafs
const CircleTrue = function (data = undefined, options = { op: {} }) {
  if (data === undefined) {
    if (this.data === undefined) {
      throw 'need data representing the ngrams'
    }
    data = this.data
  } else {
    this.data = data
  }
  document.getElementById('chart').innerHTML = ''

  // path to current node
  const pos_block = document.getElementById('curr_path') || document.createElement('div')
  pos_block.id = 'curr_path'
  pos_block.style.top = '0'
  pos_block.style.zIndex = '150'
  pos_block.style.backgroundColor = 'white'
  pos_block.style.position = 'sticky'
  pos_block.classList.add('no-print')
  {
    pos_block.innerHTML = pos_block.innerHTML || 'path to current node'
    document.getElementById('settings').insertAdjacentElement('beforebegin', pos_block)
    document.getElementById('settings').setAttribute('style', "top:30px;")
  }

  function compute_max_tocc(data) {
    if (data.tocc !== undefined) return data.tocc
    return Math.max(...data.children.map(compute_max_tocc))
  }
  const max_tocc = compute_max_tocc(data)
  console.error(max_tocc)

  const height = Math.min(window.innerWidth, window.innerHeight);
  const width = height

  settings_register.comp_nodes_sizes
  const op = {
    ...basic_accumulators
  }
  settings_register.color_gradients.forEach(x => {

    op[x.acc_name.value] = x.acc_fct.innerHTML.trim() === '' ?
      op[x.acc_name.value] || ({ init: x => NaN, inc: (x, y) => NaN })
      : (basic_accumulators_exe_order.push(x.acc_name.value), new Function('return (' + x.acc_fct.value + ')'))()
  })
  const pack = data => d3.pack()
    .size([width, height])
    .padding(3)
    (d3.hierarchy(data)
      .eachAfter(function (node) {
        // TODO put parent
        for (const key of basic_accumulators_exe_order) {
          if (op.hasOwnProperty(key)) {
            const element = op[key];
            node.data[key] = element.inc(element.init(node.data), (node.data.children || []).filter(x => x.value > 0 || (!x.children && x.params)))
          }
        }
        node.value = node.data[settings_register.comp_nodes_sizes.name.value]
      })
      // .sum(d => d.pocc)
      .sort((a, b) => b.value - a.value))

  const root = pack(data);
  let focus = root;
  let view;

  const rescale = x => Math.log1p(x)
  const colors = settings_register.color_gradients.map(({ cond, c1, c2, scale, acc_name, acc_fct }) => {
    const c = d3.scaleLinear()
      .domain([0, rescale(root.data[acc_name.value])])
      .range([c1.value, c2.value])
      .interpolate(d3.interpolateHsl)
    scale([1, root.data[acc_name.value]]);
    return { cond: ((Function('return (' + cond.value + ')'))()), color: data => c(rescale(data[acc_name.value])) }
  })
  // const color = d3.scaleLinear()
  //   .domain([0, rescale(root.zero_sum/**root.zero_count*//*root.max_tocc*/)])
  //   .range(["hsl(80,80%,60%)", "hsl(0,80%,40%)"])
  //   .interpolate(d3.interpolateHsl)
  // const color2 = d3.scaleLinear()
  //   .domain([0, rescale(root.sum_tocc/**root.zero_count*//*root.max_tocc*/)])
  //   .range(["hsl(90,80%,20%)", "hsl(90,80%,60%)"])
  //   .interpolate(d3.interpolateHsl)


  const svg = d3.select("div#chart").append('svg')
    .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
    .attr("width", width)
    .style("display", "block")
    // .style("margin", "0 -14px")
    .style("cursor", "pointer")
  // .on("click", action);

  let label;

  const prev = {}// display: "none", "fill-opacity": 0, "font-size": "20px", text: '' }

  const node = svg.append("g")
    .selectAll("circle")
    .data(root.descendants().slice(1))
    .join("circle")
    .attr("stroke", "#000")
    .attr("fill", d => {
      {
        let i = 0
        while (i < colors.length) {
          if (colors[i].cond(d.data)) {
            return colors[i].color(d.data)
          }
          i++
        }
      }
      // return d.zero_sum !== 0 ? color(rescale(d.zero_sum)) : color2(rescale(d.sum_tocc)) //d.min_tocc === 0 ? "red" : 
      // return d.children ? color(d.depth) : d.min_tocc === 0 ? "red" : color2(rescale(d.data.tocc))
    })
    // .attr("pointer-events", d => !d.children ? "none" : null)
    .on("mouseover", function (d) {
      if (d !== focus && d.depth > focus.depth) {
        d3.select(this).attr("stroke-width", 10);
        label
          .filter(function (d2) { return d2 === d })
          .style("display", function (d) { prev.display = this.style.display; return "inline" })
          .style("opacity", function (d) { prev["opacity"] = this.style["opacity"]; return 1 })
          .style("font-size", function (d) { prev["font-size"] == this.style["font-size"]; return "22.5px" })
          .text(function (d) {
            prev.text = this.innerHTML
            return get_node_value(d.data)
          })
      }
    })
    .on("mouseout", function (d) {
      if (d !== focus) {
        d3.select(this).attr("stroke-width", 1);
        label
          .filter(function (d2) { return d2 === d })
          .style("display", prev.display)
          .style("opacity", prev["opacity"])
          .style("font-size", prev["font-size"])
          .text(d.data.name)
      }
      d3.select(this).attr("stroke-width", 1);
    })
    .on("click", action);

  node
    .append('svg:title').text(function (d) {
      return `${d.data.name}
${d.data['sum pocc']}/${d.data['sum tocc']}
d.data['zero tocc sum']/d.data['sum pocc'] ${d.data['zero tocc sum'] / d.data['sum pocc']}
d.data['zero tocc sum'] ${d.data['zero tocc sum']}
d.data['not zero tocc sum'] ${d.data['not zero tocc sum']}
d.data['zero tocc sum']/d.data['not zero tocc sum'] ${d.data['zero tocc sum'] / d.data['not zero tocc sum']}
d.data['count'] ${d.data['count']}`;
    });


  label = svg.append("g")
    .style("font-size", "10px")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .selectAll("text")
    .data(root.descendants())
    .join("text")
    .style("opacity", d => d.parent === root ? 1 : 0)
    .style("display", d => d.parent === root ? "inline" : "none")
    .text(d => d.data.name);

  zoomTo([root.x, root.y, root.r * 2 * 1.05]);
  zoom(root)

  function zoomTo(v) {
    const k = width / v[2];

    view = v;

    label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    node.attr("r", d => d.r * k);
  }

  function zoom(d) {
    const focus0 = focus;

    focus = d;

    const transition = svg.transition()
      .duration(d3.event ? d3.event.altKey ? 7500 : 750 : 750)
      .tween("zoom", () => {
        const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 * 1.05]);
        return t => zoomTo(i(t));
      });

    label
      .filter(function (d) { return d.parent === focus || d === focus || this.style.display === "inline"; })
      .sort((a, b) => b.value - a.value)
      .transition(transition)
      .style("opacity", d => d.parent === focus ? 1 : 0)
      .on("start", function (d, i) {
        if (d.parent === focus && i < 20) {
          this.style.display = "inline"
        } else if (d === focus) {
          pos_block.innerHTML = get_node_value(d.data)
        };
      })
      .on("end", function (d) { if (d.parent !== focus) this.style.display = "none"; });
  };

  function action(d = root) {
    d3.event.stopPropagation()
    if (vscode_action(d.data) === 'zoom') zoom(d)
  }

  return svg.node();
}
// Keep scale in nodes
const PartitionCustom = function (data = undefined, options = { 'margin-top': '0px', 'margin-bottom': '0px', paddingTop: 20 }, reset = false) {
  if (data === undefined) {
    if (this.data === undefined) {
      throw 'need data representing the ngrams'
    }
    data = this.data
  } else {
    this.data = data
    reset = true
  }
  // path to current node
  const pos_block = document.getElementById('curr_path') || document.createElement('div')
  pos_block.id = 'curr_path'
  pos_block.style.top = '0'
  pos_block.style.zIndex = '150'
  pos_block.style.backgroundColor = 'white'
  pos_block.style.color = 'black'
  pos_block.style.position = 'sticky'
  pos_block.classList.add('no-print')
  {
    pos_block.innerHTML = pos_block.innerHTML || 'path to current node'
    document.getElementById('settings').insertAdjacentElement('beforebegin', pos_block)
    document.getElementById('settings').setAttribute('style', "top:30px;")
  }
  const op = {
    ...basic_accumulators
  }
  {
    const x = settings_register.comp_nodes_sizes
    op[x.name.value] = x.acc_fct.value.trim() === '' ?
      op[x.name.value] || ({ init: x => NaN, inc: (x, y) => NaN })
      : (op[x.name.value] || basic_accumulators_exe_order.push(x.name.value),
        new Function('return (' + x.acc_fct.value + ')'))();
  }
  settings_register.color_gradients.forEach(x => {
    op[x.acc_name.value] = x.acc_fct.innerHTML.trim() === '' ?
      op[x.acc_name.value] || ({ init: x => NaN, inc: (x, y) => NaN })
      : (op[x.acc_name.value] || basic_accumulators_exe_order.push(x.acc_name.value),
        new Function('return (' + x.acc_fct.value + ')'))()
  })
  function process_data(data, f, depth = 0) {
    data.children && data.children.forEach(x => {
      x.parent = data;
      process_data(x, f, depth + 1)
    })
    data.depth = depth
    f(data)
  }

  process_data(data, function (data) {
    for (const key of basic_accumulators_exe_order) {
      if (op.hasOwnProperty(key)) {
        const element = op[key];
        data[key] = element.inc(element.init(data), (data.children || []).filter(x => x.value > 0 || (!x.children && x.params)))
      }
    }
    data.value = data[settings_register.comp_nodes_sizes.name.value]
  })
  // .sum(d => d.pocc)
  // .sort((a, b) => b.value - a.value)

  const rescale = x => Math.log2(x)

  const colors = settings_register.color_gradients.map(({ cond, c1, c2, scale, acc_name, acc_fct }) => {
    const c = d3.scaleLinear()
      .domain([0, rescale(data[acc_name.value])])
      .range([c1.value, c2.value])
      .interpolate(d3.interpolateHsl)
    scale([1, data[acc_name.value]]);
    return { cond: ((Function('return (' + cond.value + ')'))()), color: data => c(rescale(data[acc_name.value])) }
  })

  // const color = d3.scaleLinear()
  //   .domain([0, rescale(data.zero_sum/**root.zero_count*//*root.max_tocc*/)])
  //   .range(["hsl(70,80%,60%)", "hsl(0,80%,40%)"])
  //   .interpolate(d3.interpolateHsl)
  // const color2 = d3.scaleLinear()
  //   .domain([0, rescale(data.sum_tocc/**root.zero_count*//*root.max_tocc*/)])
  //   .range(["hsl(90,80%,20%)", "hsl(90,80%,60%)"])
  //   .interpolate(d3.interpolateHsl)

  let vis_depth = parseInt(settings_register.visible_depth.value)
  // let col_width = window.innerWidth / (data.max_depth-vis_depth)
  col_width = window.innerWidth / (vis_depth - data.depth) - 4

  let height_expansion = settings_register.number1.value / data.value
  const root = data
  function render(data, node, depth = 0) {
    const curr_div = document.createElement('div')
    curr_div.style.height = `${data.value * height_expansion}px`
    {
      let i = 0
      while (i < colors.length) {
        if (colors[i].cond(data)) {
          curr_div.style.backgroundColor = colors[i].color(data)
          break
        }
        i++
      }
    }
    // data.zero_sum !== 0 ?
    //   color(rescale(data.zero_sum))
    //   : color2(rescale(data.sum_tocc))
    curr_div.classList.add('node')
    // if(!data.parent) curr_div.style.display = 'block'
    const title = document.createElement('div')
    // TODO use not zero count ignore params
    title.innerHTML = `<p><strong>${data['sum pocc']}</strong> <em>calls in production</em></p>
<p><strong>${data['sum tocc']}</strong> <em>calls in tests</em></p>
<p><strong>${data['zero sum tocc ignore params']}</strong> <em>calls to never tested functions</em></p>
<p><strong>${data['count production ignore params']}</strong> <em>functions were used in production</em></p>
<p><strong>${data['zero count tocc ignore params']}</strong> <em>functions were not tested</em></p>`
    {
      const tmp = document.createElement('p')
      tmp.innerText = data.name
      title.prepend(tmp)
    }
    curr_div.append(title)
    const tooltip = document.createElement('p')
    tooltip.innerText = data.name
    tooltip.innerHTML += `</br>
${data['sum pocc']} calls in production</br>
${data['sum tocc']} calls in tests</br>
${data['zero sum tocc ignore params']} calls in production that are never tested`
    tooltip.classList.add('tooltip')
    curr_div.addEventListener('mouseenter', function (ev) {
      ev.stopPropagation()
      tooltip.style.visibility = 'visible'
      if (this.parentElement.id !== 'chart') {
        this.parentElement.parentElement.children.item(1).style.visibility = 'hidden'
      }
      {
        const tmp = ev.clientY - 20, tmp1 = window.innerHeight - 20;
        tooltip.style.top = (tmp + 80 > tmp1 ? tmp1 - 80 : tmp) + 'px';
      }
      {
        const tmp = ev.clientX, tmp1 = window.innerWidth;
        tooltip.style.left = (tmp + 120 > tmp1 ? tmp1 - 120 : tmp)/*(width - (data.max_depth * col_width))*/ + 'px'
      }
    })
    // curr_div.addEventListener('mousemove', function (ev) {
    //   ev.stopPropagation()
    // {
    //   const tmp = ev.clientY- 20, tmp1 = window.innerHeight-20;
    //   tooltip.style.top = (tmp + 80 > tmp1 ? tmp1 - 80 : tmp) + 'px';
    // }
    // {
    //   const tmp = ev.clientX, tmp1 = window.innerWidth;
    //   tooltip.style.left = (tmp + 120 > tmp1 ? tmp1 - 120 : tmp)/*(width - (data.max_depth * col_width))*/ + 'px'
    // }
    // })
    curr_div.addEventListener('mouseleave', function (ev) {
      tooltip.style.visibility = 'hidden'
      if (this.parentElement.id !== 'chart') {
        const e = this.parentElement.parentElement.children.item(1)
        e.style.visibility = 'visible'
        {
          const tmp = ev.clientY - 20, tmp1 = window.innerHeight - 20;
          e.style.top = (tmp + 80 > tmp1 ? tmp1 - 80 : tmp) + 'px';
        }
        {
          const tmp = ev.clientX, tmp1 = window.innerWidth;
          e.style.left = (tmp + 120 > tmp1 ? tmp1 - 120 : tmp)/*(width - (data.max_depth * col_width))*/ + 'px'
        }
      }
    })

    curr_div.append(tooltip)
    const content = document.createElement('span')
    curr_div.append(content)
    function shrink(e) {
      e.style.height = '100%'
      // e.style.width = `${1000}px`;
      setTimeout(function () {
        e.children.item(0).style.display = 'block';
        e.children.item(0).style.width = '100%';
        e.children.item(2).style.width = '-webkit-fill-available'//'100%';
      }, 1000);
      [...e.parentElement.children].forEach(x => {
        if (e !== x) {
          x.style.height = '0px'
          setTimeout(function () {
            x.style.display = 'none'
          }, 1500);
        }
      })
      if (e.parentElement.id !== 'chart') {
        shrink(e.parentElement.parentElement)
      }
    }
    function unshrink(e, d, h) {
      if (root['max depth'] - vis_depth <= 3) {
        if (d.parent && d.parent['max depth'] <= (root['max depth'] - vis_depth) + 1) {
          e.style.display = 'none'
          return
        }
      } else {
        if (d.depth - data.depth > vis_depth) {
          e.style.display = 'none'
          return
        }
        if (d.parent && d.parent['max depth'] <= 3 + 1) {
          e.style.display = 'none'
          return
        }
      }
      e.style.display = 'block'
      e.children.item(0).style.display = 'inline-grid';
      e.children.item(2).style.width = null;
      [...e.children.item(2).children].forEach((x, i) => {
        x.style.display = 'block'
        // x.style.width = null
        x.children.item(0).style.width = `${col_width}px`;
        x.style.height = `${d.children[i].value * h}px`;
        unshrink(x, d.children[i], h)
      })
    }

    curr_div.addEventListener('click', function (ev) {
      ev.stopPropagation()
      if (vscode_action(data) === 'zoom') {
        PartitionCustom.focused = [curr_div, data];
        pos_block.innerHTML = get_node_value(data)
        vis_depth = parseInt(settings_register.visible_depth.value)
        // col_width = window.innerWidth / (data['max depth']-vis_depth)
        if (root['max depth'] - vis_depth <= 3) {
          col_width = window.innerWidth / (data['max depth'] - 1 - (root['max depth'] - vis_depth)) - 4
        } else {
          col_width = window.innerWidth / (vis_depth - data.depth) - 4
        }
        height_expansion = (settings_register.number1.value - 20 * data.depth) / data.value
        unshrink(curr_div, data, height_expansion)
        shrink(curr_div)
      }
    })
    node.append(curr_div)
    if (data.children)
      data.children
        .forEach(x =>
          render(x, content, depth + 1))
  }
  function refresh(data, curr_div, depth = 0) {
    if (curr_div.style.height !== '100%' && curr_div.style.height !== '0px')
      curr_div.style.height = `${data.value * height_expansion}px`
    {
      let i = 0
      while (i < colors.length) {
        if (colors[i].cond(data)) {
          curr_div.style.backgroundColor = colors[i].color(data)
          break
        }
        i++
      }
    }
    // const title = curr_div.children.item(0)
    // const tooltip = curr_div.children.item(1)
    const content = curr_div.children.item(2)
    data.children && data.children.map((x, i) =>
      refresh(x, content.children.item(i), depth + 1))
  }
  // settings_register.number1.oninput = function () {
  //   document.getElementById('chart').innerHTML = '';
  //   render(data, document.getElementById('chart'))
  // }
  if (reset) {
    settings_register.visible_depth.max = '' + data['max depth']
    if (settings_register.visible_depth.style.visibility === 'hidden') {
      settings_register.visible_depth.style.visibility = 'visible'
      settings_register.visible_depth.value = (data['max depth'] - 1)
    }
    document.getElementById('chart').innerHTML = '';
    render(data, document.getElementById('chart'))
    document.getElementById('chart').children.item(0).click()
  } else {
    col_width = width / PartitionCustom.focused[1]['max depth']
    height_expansion = (settings_register.number1.value - 20 * PartitionCustom.focused[1].depth) / PartitionCustom.focused[1].value
    refresh(data, document.getElementById('chart').children.item(0))
  }

}

const PackedRepr = PartitionCustom//CircleTrue;


window.addEventListener('message', event => {
  const message = event.data;
  console.log('message:', message)
  const computed = toTree(message)
  console.log('computed ', computed[0])
  PackedRepr({ name: 'gutenberg', children: computed });
})

let margin_top = 0,
  margin_bottom = 0;

// modify settings_register
function settings_setup() {
  // main d3 settings
  {
    const settings = document.createElement('div')
    settings.classList.add('settings')
    settings.style = 'left:0;top:inherit;'
    document.getElementById('settings').appendChild(settings)
  }
  {
    const settings = document.createElement('div')
    settings.classList.add('settings')
    settings.style = 'left:0;bottom:0;'
    document.getElementById('settings').appendChild(settings)
    {
      const block = document.createElement('span')
      block.id = 'modeButton'
      block.classList.add("radio-group")
      settings.appendChild(block);
      [{ name: 'zoom in/out', value: 'zoom', checked: true },
      { name: 'jump to declaration', value: 'jump to decl' },
      { name: 'show context', value: 'show context' }]
        .forEach(({ name, value, checked }) => {
          const b = document.createElement('input')
          b.type = 'radio'
          b.name = 'modeButton'
          b.value = value
          b.id = 'radio-' + value.replace(/ /g, '-')
          b.innerHTML = name
          if (checked) { b.toggleAttribute('checked') }
          block.appendChild(b)
          const lab = document.createElement('label')
          lab.setAttribute('for', 'radio-' + value.replace(/ /g, '-'))
          lab.onclick = ""
          lab.innerHTML = name
          block.appendChild(lab)
        })
      window.moving_mode = 'zoom'
      block.onchange = function () {
        block.childNodes.forEach(x => {
          if (x.checked) {
            window.moving_mode = x.value
          }
        }
        )
      }
    }
  }
  // advanced settings
  {
    const cont = document.createElement('div')
    cont.style = 'width:100%;left:0;right0:0;bottom:0;height:0'
    cont.style.position = 'fixed'
    cont.style.zIndex = '100'
    cont.style.backgroundColor = 'hsla(0, 0%, 50%, 0.3)'
    {
      const b = document.createElement('button')
      b.innerHTML = '^'
      b.style = 'margin: 0px auto -30px;padding: 0;top: -30px;height: 30px;position: relative;width: 40px;display: block;'
      b.onclick = function () {
        if (cont.style.height === '0px') {
          cont.style.height = 'auto'
          settings.style.height = 'auto'
          b.innerHTML = 'v'
        } else {
          cont.style.height = 0
          settings.style.height = 0
          b.innerHTML = '^'
        }

      }
      cont.appendChild(b);
    }
    const settings = document.createElement('div')
    settings.id = 'advanced-settings'
    // settings.setAttribute('height', '400px')
    cont.append(settings)
    document.getElementById('chart').insertAdjacentElement('afterend', cont)

    // visible depth
    {
      const a = document.createElement('h2')
      a.innerHTML = 'Visible Depth'
      settings.appendChild(a)

      const container = document.createElement('span')
      settings.appendChild(container);
      const slider = document.createElement('input')
      const vcontainer = document.createElement('input')
      slider.type = 'range'
      slider.min = '0'
      slider.style.visibility = 'hidden'
      // vcontainer.type = 'number'
      // vcontainer.value = slider.value
      // vcontainer.innerHTML = slider.value; // Display the default slider value

      // // Update the current slider value (each time you drag the slider handle)
      // slider.oninput = function () {
      //   vcontainer.value = this.value;
      // }
      // vcontainer.oninput = function () {
      //   slider.value = this.value;
      // }
      container.appendChild(slider);
      settings_register.visible_depth = slider
      // container.appendChild(vcontainer);
    } // in settings_register.visible_depth
    // Heigth Expand
    {
      const a = document.createElement('h2')
      a.innerHTML = 'Vertical Size'
      settings.appendChild(a)

      const container = document.createElement('span')
      settings.appendChild(container);
      const vcontainer = document.createElement('input')
      vcontainer.type = 'number'
      vcontainer.value = 900
      vcontainer.step = 1
      settings_register.number1 = vcontainer
      container.appendChild(vcontainer);
    }
    // Redraw Button
    {
      const b = document.createElement('button')
      b.innerHTML = 'redraw'
      b.onclick = function () {
        PackedRepr()
      }
      settings.appendChild(b);
    }
    // Reset Button
    {
      const b = document.createElement('button')
      b.innerHTML = 'reset'
      b.onclick = function () {
        PackedRepr(undefined, undefined, true)
      }
      settings.appendChild(b);
    }
    // Nodes Sizes
    {
      const title = document.createElement('h2')
      title.innerHTML = 'Nodes Sizes'
      settings.appendChild(title)
      const block = document.createElement('div')
      block.classList.add('no-print')
      block.id = 'legend_size'
      block.style.border = 'solid 2px'
      settings.appendChild(block)

      const input = document.createElement('input')
      input.value = 'sum pocc'
      block.append(input)

      const textarea = document.createElement('textarea')
      textarea.title = 'write accumulator here (can be a function)'
      textarea.style.verticalAlign = 'middle'
      textarea.style.width = '300px'
      textarea.style.height = '32px'
      textarea.innerHTML = `{
  init: data => data.pocc || 0,
  inc: (acc, curr) => curr.reduce((acc, x) => acc + x['sum pocc'], acc)
}`
      settings_register.comp_nodes_sizes = {
        name: input,
        acc_fct: textarea
      }
      block.append(textarea)
    } // in settings_register.comp_nodes_sizes
    // Color Gradients
    {
      const a = document.createElement('h2')
      a.innerHTML = 'Color Gradients'
      settings.appendChild(a)
      const block = document.createElement('div')
      block.classList.add('no-print')
      block.id = 'legend1'
      block.style.border = 'solid 2px'
      settings.appendChild(block)
      // path to current node
      var w = 300, h = 50;


      let gradientCount = 0
      settings_register.color_gradients = []
      const addcblock_button = document.createElement('button')
      addcblock_button.innerHTML = 'add new color gradient'
      addcblock_button.addEventListener('click', function (ev) {
        ev.stopPropagation();
        const cblock = document.createElement('div')
        cblock.style.border = 'solid 1px'
        cblock.style.backgroundColor = 'hsla(0, 0%, 70%, .5)'
        newCBlock(cblock)
        addcblock_button.insertAdjacentElement('beforebegin', cblock)
      })
      block.append(addcblock_button)

      {
        const cblock = document.createElement('div')
        cblock.style.border = 'solid 1px'
        cblock.style.backgroundColor = 'hsla(0, 0%, 70%, .5)'
        newCBlock(cblock, "(data)=>data['zero sum tocc ignore params']!==0", 'hsl(60,80%,60%)', 'hsl(0,80%,30%)', 'zero sum tocc ignore params', `{
  init: data => data.children && data.children[0] && data.children[0].params ? (data['sum tocc'] === 0 ? data['sum pocc'] : 0) : (data['sum tocc'] === 0 && !data.children ? data['sum pocc'] : 0),
  inc: (acc, curr) => curr[0] && curr[0].params ? acc : curr.reduce((acc, x) => acc + x['zero sum tocc ignore params'], acc)
}`)
        addcblock_button.insertAdjacentElement('beforebegin', cblock)
      }
      {
        const cblock = document.createElement('div')
        cblock.style.border = 'solid 1px'
        cblock.style.backgroundColor = 'hsla(0, 0%, 70%, .5)'
        newCBlock(cblock, '(data)=>true', 'hsl(110,80%,60%)', 'hsl(130,80%,20%)', 'sum tocc', `{
  init: data => data.tocc || 0,
  inc: (acc, curr) => curr.reduce((acc, x) => acc + x['sum tocc'], acc)
}`)
        addcblock_button.insertAdjacentElement('beforebegin', cblock)
      }

      function newCBlock(cblock, dcond = '(data)=>true', dc1 = 'hsl(0, 80%, 40%)', dc2 = 'hsl(80, 80%, 40%)', dacc_name = 'count', dacc = '') {
        const count = gradientCount++
        const div0 = document.createElement('div')
        cblock.append(div0)
        const div1 = document.createElement('div')
        {
          const div1cont = document.createElement('div')
          div1cont.append(div1)
          cblock.append(div1cont)
        }
        const div2 = document.createElement('div')
        cblock.append(div2)

        const condi = document.createElement('textarea')
        condi.style.width = '300px'
        condi.style.height = '32px'
        condi.innerHTML = dcond
        div0.append(condi)

        var key = d3.select(div1)
          .append("svg")
          .attr("width", w)
          .attr("height", h)
          .style('vertical-align', 'middle')

        function cInverter(value) {
          const c = d3.hsl(value)
          c.h = c.h + 180
          c.s = 1
          c.l = c.l < 0.35 ? 1 : .0
          return c.toString()
        }

        const color1 = document.createElement('input')
        {
          color1.value = dc1
          color1.style.backgroundColor = color1.value
          color1.style.borderColor = color1.value
          color1.style.margin = '10px'
          color1.style.color = cInverter(color1.value);
          div1.insertAdjacentElement('afterbegin', color1)
        }

        const color2 = document.createElement('input')
        {
          color2.value = dc2
          color2.style.backgroundColor = color2.value
          color2.style.borderColor = color2.value
          color2.style.margin = '10px'
          color2.style.color = cInverter(color2.value);
          div1.insertAdjacentElement('beforeend', color2)
        }

        const acc_name = document.createElement('input')
        acc_name.value = dacc_name
        div2.append(acc_name)

        const acc_fct = document.createElement('textarea')
        acc_fct.style.verticalAlign = 'middle'
        acc_fct.style.width = '300px'
        acc_fct.style.height = '32px'
        acc_fct.innerHTML = dacc
        div2.append(acc_fct)

        var legend = key.append("defs")
          .append("svg:linearGradient")
          .attr("id", "gradient" + count)
          .attr("x1", "0%")
          .attr("y1", "100%")
          .attr("x2", "100%")
          .attr("y2", "100%")
          .attr("spreadMethod", "pad");

        const stop1 = legend.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", color1.value)
          .attr("stop-opacity", 1);

        color1.oninput = function () {
          stop1.attr('stop-color', color1.value)
          color1.style.backgroundColor = color1.value
          color1.style.borderColor = color1.value
          color1.style.color = cInverter(color1.value);
        }

        // legend.append("stop")
        //   .attr("offset", "33%")
        //   .attr("stop-color", "#bae4bc")
        //   .attr("stop-opacity", 1);

        // legend.append("stop")
        //   .attr("offset", "66%")
        //   .attr("stop-color", "#7bccc4")
        //   .attr("stop-opacity", 1);

        const stop2 = legend.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", color2.value)
          .attr("stop-opacity", 1);

        color2.oninput = function () {
          stop2.attr('stop-color', color2.value)
          color2.style.backgroundColor = color2.value
          color2.style.borderColor = color2.value
          color2.style.color = cInverter(color2.value);
        }

        key.append("rect")
          .attr("width", w)
          .attr("height", h - 30)
          .style("fill", `url(#gradient${count})`)
          .attr("transform", "translate(0,10)");


        function scale(domain) {
          const tmp = document.getElementById('scale' + count)
          if (tmp) tmp.remove()
          var y = d3.scaleLog()
            .range([0, 300])
            .domain(domain)
            .base(2);

          var yAxis = d3.axisBottom()
            .scale(y)
            .ticks(5);

          const ticks = key.append("g")
            .attr('id', 'scale' + count)
            .attr("class", "y axis")
            .attr("transform", "translate(0,30)")
            .call(yAxis);
          ticks.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("axis title");
          // ticks.selectAll('* > text').attr("transform", function(d){;return " rotate(45) translate(30,-5)"})
          return y
        }
        // scale([300, 0], [68, 12])

        settings_register.color_gradients.push({
          cond: condi,
          c1: color1, c2: color2,
          scale: scale,
          acc_name: acc_name,
          acc_fct: acc_fct
        })
      }
    } // in settings_register.color_gradients
  }
}

settings_setup();

if (vscode.dummy === true) {
  const computed = toTree(data)
  console.log('computed ', computed)
  PackedRepr({
    name: 'gutenberg',
    children: computed
  });
} else {
  vscode.postMessage({
    command: 'ready'
  })
}
