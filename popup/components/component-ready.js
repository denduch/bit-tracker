function emitLoadingEvent(element, state) {
  const event = new CustomEvent(state, {
    bubbles: true,
    composed: true,
    detail: { component: element.tagName }
  });
  element.dispatchEvent(event);
}

export async function waitForComponentReady(element, childComponents = []) {
  emitLoadingEvent(element, 'component-loading');
  
  const styleLinks = element.shadowRoot.querySelectorAll('link[rel="stylesheet"]');
  const stylePromises = Array.from(styleLinks).map(link => 
    new Promise(resolve => {
      link.addEventListener('load', resolve);
      link.addEventListener('error', resolve);
    })
  );

  await Promise.all(stylePromises);

  if (childComponents.length > 0) {
    await Promise.all(childComponents.map(name => customElements.whenDefined(name)));
  }

  requestAnimationFrame(() => {
    element.isReady = true;
    emitLoadingEvent(element, 'component-ready');
  });
}
