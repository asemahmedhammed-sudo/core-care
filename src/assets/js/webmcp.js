// Registers the store's WebMCP tools in browsers that support WebMCP; elsewhere this file does nothing.
import { chooseToolSet, modelContextOf, registerStoreTools } from './partials/core-care-webmcp';
import './partials/core-care-ai-activity';

(async () => {
    const modelContext = modelContextOf();
    if (!modelContext || window.coreCareWebMcp) return;
    window.coreCareWebMcp = 'loading';
    // Salla's SDK loads async after deferred theme bundles; Salla.config exists only after onReady.
    await window.Salla?.onReady?.();
    const salla = window.salla || window.Salla;
    const log = message => salla?.log?.(`ThemeApp(CoreCare)::${message}`);
    const activity = document.querySelector('core-care-ai-activity');
    const { only, source } = await chooseToolSet(salla, activity?.dataset.themeFirst !== 'false');
    const tools = await registerStoreTools(modelContext, salla, { log, only, notify: change => activity?.show?.(change) });
    window.coreCareWebMcp = tools;
    log(`WebMCP tools registered: ${tools.length} (${source === 'salla' ? 'alongside Salla\'s tools' : 'theme set'})`);
})();
