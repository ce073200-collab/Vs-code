// ── VIRTUAL FILE SYSTEM (LocalStorage) ──
        const DEFAULT_FILES = {
            "index.html": { content: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Document</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>\n", lang: "html" },
            "src/App.js": { content: "import React from 'react';\nimport './styles.css';\n\nexport default function App() {\n  return (\n    <div className=\"App\">\n      <h1>Hello VS Code Web</h1>\n      <h2>Start editing to see some magic happen!</h2>\n    </div>\n  );\n}\n", lang: "javascript" },
            "src/index.js": { content: "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n\nconst root = ReactDOM.createRoot(document.getElementById('root'));\nroot.render(<App />);\n", lang: "javascript" },
            "package.json": { content: "{\n  \"name\": \"vscode-replica\",\n  \"version\": \"1.0.0\",\n  \"dependencies\": {\n    \"react\": \"^18.2.0\",\n    \"react-dom\": \"^18.2.0\"\n  }\n}\n", lang: "json" },
            "styles.css": { content: "body {\n  font-family: sans-serif;\n  background: #1e1e1e;\n  color: #fff;\n}\n.App {\n  text-align: center;\n  padding: 50px;\n}\n", lang: "css" },
            "README.md": { content: "# VS Code Replica\n\nThis is a fully functional web-based replica of Visual Studio Code, utilizing the Monaco Editor exactly like the real thing.\n\n## Features\n- Syntax Highlighting & IntelliSense (via Monaco)\n- Persistence via `localStorage`\n- Multi-tab management\n- Theming (Dark, Light)\n- Simulated Terminal\n", lang: "markdown" }
        };

        let files = {};
        try {
            const stored = localStorage.getItem('vscode-vfs');
            if (stored) files = JSON.parse(stored);
            else files = JSON.parse(JSON.stringify(DEFAULT_FILES));
        } catch {
            files = JSON.parse(JSON.stringify(DEFAULT_FILES));
        }

        function saveVFS() {
            localStorage.setItem('vscode-vfs', JSON.stringify(files));
        }

        // ── MONACO EDITOR INTEGRATION ──
        let editor;
        let monacoModels = {};
        let activeFile = null;
        let openTabs = []; // Array of file paths

        require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' } });
        require(['vs/editor/editor.main'], function () {
            // Initialize Monaco
            editor = monaco.editor.create(document.getElementById('monaco-container'), {
                theme: 'vs-dark',
                automaticLayout: true,
                fontSize: 14,
                minimap: { enabled: true },
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                roundedSelection: false,
                padding: { top: 10 }
            });

            // Sync with VFS
            Object.keys(files).forEach(path => {
                const model = monaco.editor.createModel(files[path].content, files[path].lang);
                model.onDidChangeContent(() => {
                    files[path].content = model.getValue();
                    saveVFS();
                    updateExplorerUnsavedState(path, true); // Visual indicator
                });
                monacoModels[path] = model;
            });

            // Editor events
            editor.onDidChangeCursorPosition(e => {
                document.getElementById('sb-cursor').innerText = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
            });

            // Register custom theme
            monaco.editor.defineTheme('hc-black', {
                base: 'hc-black', inherit: true, rules: [], colors: {}
            });

            // Add HTML Tag Snippets / Autocompletions
            monaco.languages.registerCompletionItemProvider('html', {
                provideCompletionItems: function (model, position) {
                    var word = model.getWordUntilPosition(position);
                    var range = {
                        startLineNumber: position.lineNumber,
                        endLineNumber: position.lineNumber,
                        startColumn: word.startColumn,
                        endColumn: word.endColumn
                    };
                    var tags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p', 'a', 'button', 'ul', 'li', 'ol', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'form', 'label', 'select', 'option', 'textarea', 'nav', 'header', 'footer', 'main', 'section', 'article', 'aside', 'audio', 'video', 'canvas', 'svg', 'iframe', 'script', 'style', 'title', 'strong', 'em', 'b', 'i'];
                    var selfClosingTags = ['img', 'input', 'br', 'hr', 'meta', 'link'];

                    var suggestions = tags.map(tag => ({
                        label: tag,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: `<${tag}>$1</${tag}>`,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: `HTML <${tag}> element`,
                        range: range
                    }));

                    var scSuggestions = selfClosingTags.map(tag => ({
                        label: tag,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: `<${tag}$1 />`,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: `HTML <${tag}> element (self-closing)`,
                        range: range
                    }));

                    // HTML Boilerplate
                    var boilerplate = {
                        label: '! (HTML5 Boilerplate)',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>$1</title>\n</head>\n<body>\n  $2\n</body>\n</html>`,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: `HTML5 Standard Boilerplate`,
                        range: range
                    };

                    return { suggestions: [...suggestions, ...scSuggestions, boilerplate] };
                }
            });

            renderExplorer();
        });

        // ── UI STATE MANAGEMENT ──
        function openFile(path) {
            if (!files[path] || !monaco) return;

            // UI transitions
            document.getElementById('welcome-screen').classList.remove('active');
            document.getElementById('monaco-container').style.display = 'block';

            // Manage Tabs
            if (!openTabs.includes(path)) {
                openTabs.push(path);
            }
            activeFile = path;

            // Update Monaco
            editor.setModel(monacoModels[path]);
            document.getElementById('sb-language').innerText = files[path].lang;
            document.getElementById('editor-breadcrumb').innerHTML = `<span>VS Code Replica</span> <i class="codicon codicon-chevron-right" style="font-size:10px;margin:0 2px;"></i> <span>${path.split('/').join('</span> <i class="codicon codicon-chevron-right" style="font-size:10px;margin:0 2px;"></i> <span>')}</span>`;

            renderTabs();
            updateExplorerSelection();
        }

        function renderTabs() {
            const container = document.getElementById('editor-tabs');
            container.innerHTML = '';
            openTabs.forEach(path => {
                const filename = path.split('/').pop();
                const isActive = path === activeFile;

                const ext = filename.split('.').pop();
                const colors = { js: '#e8c36a', jsx: '#50b8e9', html: '#e37933', css: '#6ebeff', json: '#cbcb41', md: '#3dbbdf' };
                const curcolor = colors[ext] || '#cccccc';

                const tab = document.createElement('div');
                tab.className = `tab ${isActive ? 'active' : ''}`;
                tab.innerHTML = `<i class="codicon codicon-file-code" style="color:${curcolor};font-size:13px;margin-right:6px;"></i> ${filename} <span class="tab-close" data-path="${path}"><i class="codicon codicon-close"></i></span>`;

                tab.addEventListener('click', () => openFile(path));
                container.appendChild(tab);
            });

            document.querySelectorAll('.tab-close').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeFile(btn.dataset.path);
                });
            });
        }

        function closeFile(path) {
            openTabs = openTabs.filter(p => p !== path);
            if (activeFile === path) {
                if (openTabs.length > 0) {
                    openFile(openTabs[openTabs.length - 1]);
                } else {
                    activeFile = null;
                    document.getElementById('monaco-container').style.display = 'none';
                    document.getElementById('welcome-screen').classList.add('active');
                    document.getElementById('sb-language').innerText = 'Plain Text';
                    document.getElementById('editor-breadcrumb').innerHTML = '';
                }
            }
            renderTabs();
        }

        // ── EXPLORER TREE RENDERING ──
        function renderExplorer() {
            const tree = document.getElementById('explorer-tree');
            tree.innerHTML = '';
            // Flat structure for simplicity, could be nested
            Object.keys(files).sort().forEach(path => {
                const parts = path.split('/');
                const filename = parts[parts.length - 1];
                const level = parts.length + 1;

                const ext = filename.split('.').pop();
                const colors = { js: '#e8c36a', jsx: '#50b8e9', html: '#e37933', css: '#6ebeff', json: '#cbcb41', md: '#3dbbdf' };
                const curcolor = colors[ext] || '#cccccc';

                const item = document.createElement('div');
                item.className = `tree-item level-${level}`;
                item.dataset.path = path;
                item.innerHTML = `<i class="codicon codicon-file-code tree-icon" style="color:${curcolor}"></i> <span class="filename">${filename}</span> <span class="unsaved-dot" style="display:none; margin-left:auto; width:8px;height:8px;background:var(--vscode-fg);border-radius:50%;"></span>`;

                item.addEventListener('click', () => openFile(path));
                tree.appendChild(item);
            });
            updateExplorerSelection();
        }

        function updateExplorerSelection() {
            document.querySelectorAll('#explorer-tree .tree-item').forEach(el => {
                el.classList.toggle('selected', el.dataset.path === activeFile);
            });
        }

        function updateExplorerUnsavedState(path, isUnsaved) {
            // Just as an indicator
        }

        // Create New File
        function createNewFile() {
            const filename = prompt("Enter new file name (e.g., config.json):");
            if (filename && !files[filename]) {
                let lang = "plaintext";
                if (filename.endsWith('.js')) lang = "javascript";
                else if (filename.endsWith('.json')) lang = "json";
                else if (filename.endsWith('.css')) lang = "css";
                else if (filename.endsWith('.html')) lang = "html";

                files[filename] = { content: "", lang: lang };
                saveVFS();
                const model = monaco.editor.createModel("", lang);
                model.onDidChangeContent(() => { files[filename].content = model.getValue(); saveVFS(); });
                monacoModels[filename] = model;

                renderExplorer();
                openFile(filename);
            }
        }

        // ── ACTIVITY BAR & SIDEBAR ──
        document.querySelectorAll('.activity-icon[data-target]').forEach(icon => {
            icon.addEventListener('click', () => {
                const target = icon.dataset.target;
                const sidebar = document.getElementById('sidebar');
                const isActive = icon.classList.contains('active');

                if (isActive && !sidebar.classList.contains('collapsed')) {
                    sidebar.classList.add('collapsed');
                    icon.classList.remove('active');
                } else {
                    sidebar.classList.remove('collapsed');
                    document.querySelectorAll('.activity-icon').forEach(i => i.classList.remove('active'));
                    icon.classList.add('active');

                    document.querySelectorAll('.sidebar-pane').forEach(p => p.classList.remove('active'));
                    document.getElementById(`pane-${target}`).classList.add('active');

                    if (target === 'search') document.getElementById('search-input').focus();
                }
            });
        })

        // Sidebar Resizer
        {
            let sbResizing = false;
            const resizer = document.getElementById('sidebar-resizer');
            const sidebar = document.getElementById('sidebar');
            resizer.addEventListener('mousedown', e => { sbResizing = true; resizer.classList.add('active'); });
            document.addEventListener('mousemove', e => {
                if (!sbResizing) return;
                let w = e.clientX - 48; // minus activity bar
                if (w < 150) w = 150; if (w > 600) w = 600;
                sidebar.style.width = w + 'px';
            });
            document.addEventListener('mouseup', () => { sbResizing = false; resizer.classList.remove('active'); });
        }

        // ── BOTTOM PANEL ──
        document.querySelectorAll('.panel-tab[data-paneltarget]').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const target = tab.dataset.paneltarget;
                document.querySelectorAll('#bottom-panel .panel-content').forEach(p => p.classList.remove('active'));
                document.getElementById(`bpanel-${target}`).classList.add('active');

                if (target === 'terminal') {
                    document.getElementById('term-input').focus();
                }
            });
        });

        // Panel Resizer
        {
            let pResizing = false;
            const panelResizer = document.getElementById('panel-resizer');
            const bottomPanel = document.getElementById('bottom-panel');
            let startY, startH;
            panelResizer.addEventListener('mousedown', e => { pResizing = true; startY = e.clientY; startH = bottomPanel.offsetHeight; panelResizer.style.background = 'var(--vscode-accent)'; });
            document.addEventListener('mousemove', e => {
                if (!pResizing) return;
                const h = startH + (startY - e.clientY);
                bottomPanel.style.height = `${Math.max(100, Math.min(h, window.innerHeight * 0.8))}px`;
            });
            document.addEventListener('mouseup', () => { pResizing = false; panelResizer.style.background = 'transparent'; });
        }

        // ── TERMINAL ──
        const termInput = document.getElementById('term-input');
        const termLog = document.getElementById('term-log');
        termInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                const cmd = termInput.value.trim();
                if (!cmd) return;

                // Print command
                const cmdDiv = document.createElement('div');
                cmdDiv.innerHTML = `<span class="cmd-prompt">user@web-ide ~ $</span> <span>${cmd}</span>`;
                termLog.appendChild(cmdDiv);

                // Execute
                const resDiv = document.createElement('div');
                if (cmd === 'clear') {
                    termLog.innerHTML = '';
                } else if (cmd === 'help') {
                    resDiv.innerText = "Commands: clear, help, ls, cat <file>, date, whoami, npm start";
                } else if (cmd === 'ls') {
                    resDiv.innerText = Object.keys(files).join('  ');
                } else if (cmd.startsWith('cat ')) {
                    const fname = cmd.split(' ')[1];
                    if (files[fname]) {
                        resDiv.innerText = files[fname].content;
                        resDiv.style.color = "var(--vscode-fg)";
                        resDiv.style.opacity = "0.8";
                    } else {
                        resDiv.innerText = `cat: ${fname}: No such file or directory`;
                        resDiv.style.color = "var(--vscode-error)";
                    }
                } else if (cmd === 'date') {
                    resDiv.innerText = new Date().toString();
                } else if (cmd === 'npm start') {
                    resDiv.innerHTML = "<span style='color:var(--vscode-success)'>Starting development server...<br>Compiled successfully!</span>";
                } else if (cmd === 'whoami') {
                    resDiv.innerText = "developer";
                } else {
                    resDiv.innerText = `bash: ${cmd}: command not found`;
                    resDiv.style.color = "var(--vscode-error)";
                }

                if (cmd !== 'clear') termLog.appendChild(resDiv);
                termInput.value = '';

                // Scroll to bottom
                const termPane = document.getElementById('bpanel-terminal');
                termPane.scrollTop = termPane.scrollHeight;
            }
        });

        // ── COMMAND PALETTE ──
        const paletteOverlay = document.getElementById('cmd-overlay');
        const paletteInput = document.getElementById('palette-input');
        const paletteList = document.getElementById('palette-list');

        const COMMANDS = [
            { label: 'File: New File', cmd: 'file.newFile', keys: 'Ctrl+N' },
            { label: 'File: Save', cmd: 'file.save', keys: 'Ctrl+S' },
            { label: 'Workbench: Toggle Sidebar', cmd: 'workbench.toggleSidebar', keys: 'Ctrl+B' },
            { label: 'Workbench: Toggle Panel', cmd: 'workbench.togglePanel', keys: 'Ctrl+`' },
            { label: 'View: Close Editor', cmd: 'workbench.close', keys: 'Ctrl+W' },
            { label: 'Theme: Dark', cmd: 'theme.dark' },
            { label: 'Theme: Light', cmd: 'theme.light' },
            { label: 'Theme: High Contrast', cmd: 'theme.hc' },
            { label: 'Find: Find in File', cmd: 'edit.find', keys: 'Ctrl+F' }
        ];

        function togglePalette() {
            if (paletteOverlay.classList.contains('open')) {
                paletteOverlay.classList.remove('open');
                if (editor && activeFile) editor.focus();
            } else {
                paletteOverlay.classList.add('open');
                paletteInput.value = '>';
                renderPaletteItems('');
                setTimeout(() => paletteInput.focus(), 10);
            }
        }

        function renderPaletteItems(filter) {
            paletteList.innerHTML = '';
            const search = filter.replace('>', '').trim().toLowerCase();

            const filtered = COMMANDS.filter(c => c.label.toLowerCase().includes(search));

            filtered.forEach(c => {
                const item = document.createElement('div');
                item.className = 'cmd-item';
                item.innerHTML = `<span>${c.label}</span> ${c.keys ? `<span class="cmd-item-key">${c.keys}</span>` : ''}`;
                item.addEventListener('click', () => {
                    paletteOverlay.classList.remove('open');
                    runCommand(c.cmd);
                });
                paletteList.appendChild(item);
            });
        }

        paletteInput.addEventListener('input', e => renderPaletteItems(e.target.value));

        // ── COMMAND EXECUTION ──
        function runCommand(cmdId) {
            switch (cmdId) {
                case 'file.newFile': createNewFile(); break;
                case 'file.save': saveVFS(); break;
                case 'workbench.toggleSidebar':
                    document.getElementById('sidebar').classList.toggle('collapsed');
                    break;
                case 'workbench.togglePanel':
                    document.getElementById('bottom-panel').classList.toggle('collapsed');
                    break;
                case 'workbench.close':
                    if (activeFile) closeFile(activeFile);
                    break;
                case 'theme.dark': setTheme('dark'); break;
                case 'theme.light': setTheme('light'); break;
                case 'theme.hc': setTheme('dark'); monaco.editor.setTheme('hc-black'); break;
                case 'edit.find':
                    if (editor) editor.trigger('keyboard', 'actions.find');
                    break;
            }
        }

        function setTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            if (monaco && editor) {
                monaco.editor.setTheme(theme === 'light' ? 'vs' : 'vs-dark');
            }
        }

        // ── GLOBAL EVENTS ──
        document.addEventListener('keydown', e => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                togglePalette();
            } else if (e.key === 'Escape') {
                if (paletteOverlay.classList.contains('open')) paletteOverlay.classList.remove('open');
                document.querySelectorAll('.menu-dropdown').forEach(d => d.classList.remove('open'));
            } else if (e.ctrlKey && e.key === '`') {
                e.preventDefault();
                runCommand('workbench.togglePanel');
            } else if (e.ctrlKey && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                runCommand('workbench.toggleSidebar');
            } else if (e.ctrlKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                runCommand('file.save');
            } else if (e.ctrlKey && e.key.toLowerCase() === 'f') {
                // Let Monaco handle Find if editor is focused, else proxy
                if (!document.querySelector('#monaco-container textarea:focus')) {
                    e.preventDefault(); runCommand('edit.find');
                }
            }
        });

        // Menu dropdown logic
        document.querySelectorAll('.titlebar-menu').forEach(menu => {
            menu.addEventListener('click', e => {
                const drop = menu.querySelector('.menu-dropdown');
                const wasOpen = drop.classList.contains('open');
                document.querySelectorAll('.menu-dropdown').forEach(d => d.classList.remove('open'));
                if (!wasOpen) drop.classList.add('open');
                e.stopPropagation();
            });
        });

        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', e => {
                document.querySelectorAll('.menu-dropdown').forEach(d => d.classList.remove('open'));
                if (item.dataset.cmd) {
                    runCommand(item.dataset.cmd);
                }
                e.stopPropagation();
            });
        });

        document.addEventListener('click', () => {
            document.querySelectorAll('.menu-dropdown').forEach(d => d.classList.remove('open'));
            paletteOverlay.classList.remove('open');
        });

        // Command Center and Layout Controls
        const cmdCenterBtn = document.getElementById('command-center-btn');
        if (cmdCenterBtn) {
            cmdCenterBtn.addEventListener('click', e => {
                togglePalette();
                e.stopPropagation();
            });
        }

        document.querySelectorAll('.layout-icon[data-cmd]').forEach(icon => {
            icon.addEventListener('click', e => {
                runCommand(icon.dataset.cmd);
                e.stopPropagation();
            });
        });

        paletteOverlay.addEventListener('click', e => {
            if (e.target === paletteOverlay) paletteOverlay.classList.remove('open');
        });

        // Welcome Screen Links
        document.querySelectorAll('.welcome-link[data-open]').forEach(link => {
            link.addEventListener('click', () => openFile(link.dataset.open));
        });
        document.querySelectorAll('.welcome-link[data-cmd]').forEach(link => {
            link.addEventListener('click', () => runCommand(link.dataset.cmd));
        });

        // Search logic Basic
        document.getElementById('search-input').addEventListener('input', e => {
            const q = e.target.value.toLowerCase();
            const res = document.getElementById('search-results');
            res.innerHTML = '';
            if (!q) return;

            let found = 0;
            Object.keys(files).forEach(path => {
                const content = files[path].content;
                if (content.toLowerCase().includes(q)) {
                    found++;
                    const div = document.createElement('div');
                    div.innerHTML = `<i class="codicon codicon-file"></i> ${path}`;
                    div.style.padding = "4px 0";
                    div.style.cursor = "pointer";
                    div.addEventListener('click', () => openFile(path));
                    res.appendChild(div);
                }
            });
            if (found === 0) res.innerHTML = "No results found.";
        });
