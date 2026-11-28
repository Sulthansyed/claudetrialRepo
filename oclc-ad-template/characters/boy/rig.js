// Boy: Malay Muslim, about 10. Navy songkok, pastel teal baju Melayu with matching trousers.
import { kidParts, kidExpressions, kidChains, kidRest } from '../lib/kid.js';
import { props } from '../lib/props.js';

export default function boy(C) {
  return {
    name: 'boy', height: 576, view: [-260, -700, 520, 720],
    parts: kidParts(C, 'boy'), chains: kidChains, rest: kidRest,
    expressions: kidExpressions, props: props(C),
  };
}
