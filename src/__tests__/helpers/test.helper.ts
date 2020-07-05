import { AnyObject } from "@loopback/repository";

export function omit(object?: AnyObject | null, ...keys: string[]) {
    if (!object || !keys.length) return object;
    return Object.keys(object)
        .filter(k => !keys.includes(k))
        .reduce((acc: AnyObject, key) => ((acc[key] = object[key]), acc), {});
}
