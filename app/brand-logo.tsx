import {brand} from '../lib/brand';
import './brand.css';

export default function BrandLogo(){
 return <span className="brand-lockup" aria-hidden="true">
  <svg className="brand-symbol" viewBox="0 0 64 64" width="44" height="44" focusable="false">
   <path fill={brand.ink} d={brand.tile}/>
   <path fill={brand.paper} d={brand.letter}/>
   <path fill={brand.accent} d={brand.quote}/>
  </svg>
  <span className="brand-lettering"><span className="brand-name">读词</span><span className="brand-caption">READING NOTES</span></span>
 </span>;
}
