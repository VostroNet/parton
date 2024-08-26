// import deepmerge from 'deepmerge';
import {
  isAbstractType,
  isCompositeType,
  isInputType,
  isLeafType,
  isOutputType,
} from 'graphql';

// eslint-disable-next-line @typescript-eslint/no-var-requires
import deepmerge from 'deepmerge';

function isPrimitive(test: any) {
  return test !== Object(test);
}
function isGraphQLObject(o: unknown) {
  return (
    isInputType(o) ||
    isOutputType(o) ||
    isLeafType(o) ||
    isCompositeType(o) ||
    isAbstractType(o)
  );
}
// function executeChain(arr: any[]) {
//   arr.reduce((e) => {
//     const result = e();
//     if(result !== null))

// })

export default function merge<T>(
  a: Partial<unknown>,
  b: Partial<unknown>,
  options?: any,
): T {
  return deepmerge(a, b, {
    clone: false,
    isMergeableObject,
    ...options,
  }) as T;
}
export function isMergeableObject(o: any) {
  if (!o) {
    return false;
  }
  if (o instanceof Function) {
    return false;
  }
  if (isPrimitive(o)) {
    return false;
  }
  if (Array.isArray(o)) {
    return true;
  }

  // TODO: need to figure out how to pass extra functions outside of merge
  if (isGraphQLObject(o)) {
    return false;
  }
  return isPlainObject(o);
}

export function isPlainObject(value: any) {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return (
    (prototype === null ||
      prototype === Object.prototype ||
      Object.getPrototypeOf(prototype) === null) &&
    !(Symbol.toStringTag in value) &&
    !(Symbol.iterator in value)
  );
}
