import xss from 'xss';

const options = {
  whiteList: {},
  stripIgnoreTag: true,
};

export const sanitize = (obj) => {
  if (typeof obj === 'string') return xss(obj, options);
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string') result[k] = xss(v, options);
      else result[k] = sanitize(v);
    }
    return result;
  }
  return obj;
};
