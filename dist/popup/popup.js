(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const o of s)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function t(s){const o={};return s.integrity&&(o.integrity=s.integrity),s.referrerPolicy&&(o.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?o.credentials="include":s.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(s){if(s.ep)return;s.ep=!0;const o=t(s);fetch(s.href,o)}})();class l{get(e,t){return new Promise((i,s)=>{chrome.runtime.sendMessage({type:e,payload:t},o=>{if(chrome.runtime.lastError)return s(chrome.runtime.lastError);i(o)})})}on(e,t){chrome.runtime.onMessage.addListener((i,s,o)=>(i.type===e&&Promise.resolve(t(i.payload,s)).then(o),!0))}}const d=new l,h={GET_ARTISTS:"GET_ARTISTS"};class u{state;listeners=new Set;constructor(e){this.state=e}getState(){return this.state}setState(e){this.state={...this.state,...e},this.listeners.forEach(t=>t(this.state))}subscribe(e){this.listeners.add(e)}unsubscribe(e){this.listeners.delete(e)}}const n=new u({artists:[],isLoading:!0});class f extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}connectedCallback(){this.switchTab("artists"),this.render(),this.addEventListeners()}render(){this.shadowRoot&&(this.shadowRoot.innerHTML=`
            <link rel="stylesheet" href="components/tab-view.css">
            <div class="tabs">
                <button class="tab active" data-tab="artists">Artists</button>
                <button class="tab" data-tab="events">Events</button>
            </div>
            <div class="panels">
                <slot name="artists"></slot>
                <slot name="events"></slot>
            </div>
        `)}addEventListeners(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",t=>{const i=t.currentTarget.dataset.tab;i&&this.switchTab(i)})})}switchTab(e){this.shadowRoot&&(this.shadowRoot.querySelectorAll(".tab").forEach(t=>{t.classList.toggle("active",t.dataset.tab===e)}),this.querySelectorAll("[slot]").forEach(t=>{t.style.display=t.slot===e?"block":"none"}))}}customElements.define("tab-view",f);class m extends HTMLElement{handleStoreUpdate;constructor(){super(),this.attachShadow({mode:"open"}),this.handleStoreUpdate=this.render.bind(this)}connectedCallback(){n.subscribe(this.handleStoreUpdate),this.render()}disconnectedCallback(){n.unsubscribe(this.handleStoreUpdate)}render(){if(!this.shadowRoot)return;const{artists:e,isLoading:t}=n.getState();this.shadowRoot.innerHTML=`
            <link rel="stylesheet" href="components/artists-view.css">
            <div>
                <h2>Artists</h2>
                ${t?"<p>Loading artists...</p>":`
                    ${e.length>0?`
                        <ul>
                            ${e.map(i=>`<li>${i.name}</li>`).join("")}
                        </ul>
                    `:"<p>No artists found.</p>"}
                `}
            </div>
        `}}customElements.define("artists-view",m);class p extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}connectedCallback(){this.render()}render(){this.shadowRoot&&(this.shadowRoot.innerHTML=`
            <link rel="stylesheet" href="components/events-view.css">
            <div>
                <h2>Events</h2>
                <p>This is the events view.</p>
            </div>
        `)}}customElements.define("events-view",p);async function c(){try{console.log("Sending GET_ARTISTS request from popup..."),n.setState({isLoading:!0});const r=await d.get(h.GET_ARTISTS);console.log("Response from service worker:",r),r.status==="success"?n.setState({artists:r.data,isLoading:!1}):(console.error("Failed to fetch artists:",r.message),n.setState({isLoading:!1}))}catch(r){console.error("Error communicating with service worker:",r),n.setState({isLoading:!1})}}async function g(){const r=document.getElementById("mock-toggle");if(r){const{useMocks:e=!0}=await chrome.storage.local.get("useMocks");r.checked=e,r.addEventListener("change",async t=>{const i=t.target.checked;await chrome.storage.local.set({useMocks:i}),await c()})}}async function w(){await g(),await c()}w();
