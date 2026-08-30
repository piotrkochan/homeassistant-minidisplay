import "./card";
import "./editor";

declare global { interface Window { customCards?: Array<Record<string, unknown>> } }
window.customCards ??= [];
if (!window.customCards.some(card => card.type === "mini-display-dashboard-card")) window.customCards.push({type:"mini-display-dashboard-card",name:"Home Assistant Mini-Display",description:"Configure and preview a physical Mini-Display",preview:true});
