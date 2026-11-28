// Girl: Malay Muslim, about 10. Cream hijab with a thin navy outline; modest navy school baju kurung.
import { kidParts, kidExpressions, kidChains, kidRest } from '../lib/kid.js';
import { props } from '../lib/props.js';

export default function girl(C) {
  return {
    name: 'girl', height: 554, view: [-260, -700, 520, 720],
    parts: kidParts(C, 'girl'), chains: kidChains, rest: kidRest,
    expressions: kidExpressions, props: props(C),
  };
}
