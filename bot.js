bot ? bot.stop() : null;
{
    const addIdAndClasses = (el, id = null, classes = null) => {
        if (id)
            el.id = controllerId;

        if (classes)
            el.classList.add(...classes);
    }

    const handleBtnClick = (btn, fn) => {
        const state = btn.classList.contains('btn-on');
        btn.classList.toggle('btn-on');
        bot.text[fn](state);
        return state;
    }

    const download = (data, filename, type) => {
        var file = new Blob([data], {
            type: type
        });
        if (window.navigator.msSaveOrOpenBlob) // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename);
        else { // Others
            var a = document.createElement("a"),
                url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        }
    }

    const editBtn = document.createElement('span');
    editBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path d="M18 14.45v6.55h-16v-12h6.743l1.978-2h-10.721v16h20v-10.573l-2 2.023zm1.473-10.615l1.707 1.707-9.281 9.378-2.23.472.512-2.169 9.292-9.388zm-.008-2.835l-11.104 11.216-1.361 5.784 5.898-1.248 11.103-11.218-4.536-4.534z"/></svg>'
    editBtn.classList.add('editBtn', 'queue-icon');
    editBtn.title = 'Edit message'

    const handleBtn = document.createElement('span');
    handleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path d="M24 12l-6-5v4h-5v-5h4l-5-6-5 6h4v5h-5v-4l-6 5 6 5v-4h5v5h-4l5 6 5-6h-4v-5h5v4z"/></svg>'
    handleBtn.classList.add('bot-handle', 'queue-icon');
    handleBtn.title = 'Move message'

    const removeBtn = document.createElement('span');
    removeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"><path d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z"/></svg>';
    removeBtn.classList.add('bot-remove', 'queue-icon');
    removeBtn.title = 'Delete message'
    
    const applyBtn = document.createElement('span');
    applyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 13h-5v5h-2v-5h-5v-2h5v-5h2v5h5v2z"/></svg>';
    applyBtn.classList.add('bot-temp-apply');
    applyBtn.title = 'Apply template'

    const menuBtn = document.createElement('span');
    menuBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path d="M12 18c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3zm0-9c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3zm0-9c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3z"/></svg>';
    menuBtn.classList.add('bot-temp-menu');

    var bot = {

        version: '3.0',
        botInterval: null,
        fakeTypeInterval: null,
        condInterval: null,
        rate: 500,
        condRate: 1000,
        isRunning: false,
        isAutoNext: false,
        isFirstRun: true,
        isQueueRunning: true,
        isCondsRunning: true,

        cp: {
            btn: '',
            btnAutoNext: '',
            panel: '',
            rateController: '',
            rateText: '',
            listForm: '',
            addToList: '',
            isHidden: false,
            position: 'left',

            init() {
                const body = document.querySelector('body');

                const oldBotPanel = document.querySelector('#botPanel');
                oldBotPanel ? (oldBotPanel.remove()) : null;

                const oldSortablejs = document.querySelector('#sortablejs');
                oldSortablejs ? (oldSortablejs.remove()) : null;

                const sortablejs = document.createElement('script');
                sortablejs.id = 'sortablejs';
                sortablejs.src = 'https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js';
                body.appendChild(sortablejs);

                const backendUrl = 'https://bloonbot.herokuapp.com/';
                // const backendUrl = 'http://localhost:3003/';

                const constructCond = (ifval, thenval) => {
                    return msg = {
                        ifs: [ifval],
                        thens: [thenval]
                    }
                }

                sortablejs.addEventListener('load', () => {
                    Sortable.create(this.list, {
                        group: 'botQueue',
                        animation: 100,
                        handle: '.bot-handle',
                        onEnd: e => {
                            const kids = this.list.children;
                            const newTextArr = [];
        
                            for (let i = 0; i < kids.length; i++) {
                                kid = kids[i];
                                // if(!kid.classList.contains('bot-handle') && !kid.classList.contains('editBtn'))
                                newTextArr.push(kid.textContent);
                            }
        
                            bot.text.mutateTextArr(newTextArr);
                        }
                    });

                    Sortable.create(this.condList, {
                        group: 'botConds',
                        animation: 100,
                        handle: '.bot-handle',
                        onEnd: e => {
                            const kids = this.condList.children;
                            const newTextArr = [];
        
                            for (let i = 0; i < kids.length; i++) {
                                const ifContent = kids[i].children[0].textContent;
                                const thenContent = kids[i].children[1].textContent;
                                
                                const cond = constructCond(ifContent, thenContent);
                                newTextArr.push(cond);
                            }
        
                            bot.text.mutateTextArr(newTextArr);
                        }
                    })
                })

                this.all = document.createElement('div');
                this.all.id = 'bot--all-without-hide-btn'

                const createParentDiv = (el, childEl, elType = 'div') => { //childEl must be an array
                    this[el] = document.createElement(elType);

                    for (let i = 0; i < childEl.length; i++) {
                        const child = childEl[i]
                        if(typeof child === 'string'){
                            this[el].appendChild(this[child]);
                        } else {
                            this[el].appendChild(child);
                        }
                    }

                    return this[el]
                }

                const createParentDivAndAppend = (el, childEl, parentEl = 'all', elType = 'div') => { //childEl must be an array
                    this[el] = createParentDiv(el, childEl, elType);
                    this[parentEl].appendChild(this[el]);

                    return this[el]
                }

                const makeEl = (classes = [], childElsOrText = '', elType = 'div') => {
                    el = document.createElement(elType)
                    
                    if(childElsOrText){
                        if(typeof childElsOrText === 'string')
                            el.appendChild(document.createTextNode(childElsOrText));
                        else {
                            if(!Array.isArray(childElsOrText)) el.appendChild(childElsOrText)
                            else {
                                for (let i = 0; i < childElsOrText.length; i++) {
                                    const child = childElsOrText[i]
                                    el.appendChild(child)
                                }
                            }
                        }
                    }

                    if(Array.isArray(classes)) el.classList.add(...classes)
                    else if (classes) el.classList.add(classes)

                    return el
                }

                const createCheckbox = (parentEl, el, setFunction, label, checked = false, disabled = false, fn) => {
                    this[el] = document.createElement('input');
                    this[el].type = 'checkbox';
                    this[el].checked = checked;
                    this[el].disabled = disabled;
                    this[el].addEventListener('change', e => {
                        const chked = e.target.checked;
                        bot.text[setFunction](chked);
                        if (fn) fn(chked)
                    });

                    createParentDivAndAppend(parentEl, [el], 'all', 'label');
                    this[parentEl].appendChild(document.createTextNode(label));
                }

                const createBtn = (btn, text, classes, clickFn, parentEl = 'all') => {
                    this[btn] = document.createElement('button');
                    // this[btn].type = 'button';
                    addIdAndClasses(this[btn], null, classes);
                    this[btn].appendChild(document.createTextNode(text));
                    this[btn].addEventListener('click', clickFn);

                    if(typeof parentEl === 'string')
                        this[parentEl].appendChild(this[btn]);
                    else
                        parentEl.appendChild(this[btn])
                }

                const createRange = (parentEl, parentElId, label, labelText, controller, controllerId, min, max, value, step, fn) => {
                    this[label] = document.createElement('span');
                    this[label].innerHTML = labelText;

                    this[controller] = document.createElement('input');
                    this[controller].id = controllerId;
                    this[controller].type = 'range';
                    this[controller].min = min;
                    this[controller].max = max;
                    this[controller].value = value;
                    this[controller].step = step;
                    this[controller].addEventListener('input', fn);

                    createParentDivAndAppend(parentEl, [label, controller])
                    this.rate.id = parentElId;
                }

                const appendElWithText = (el, classes, text = 'none', parentEl = 'all', elType = 'div') => {
                    this[el] = document.createElement(elType);
                    this[el].classList.add(...classes);
                    const textEl = document.createTextNode(text);

                    this[el].appendChild(textEl);
                    this[parentEl].appendChild(this[el]);

                    return this[el]
                }

                createBtn('hideBtn', 'HIDE', ['bot--btn', 'bot--hide-btn'],
                    e => {
                        this.toggleHide();
                    });

                // body.addEventListener("keydown", e => {
                //     if (e.key === 'h') {
                //         this.toggleHide();
                //     }
                // });

                this.panel = document.createElement('div');
                this.panel.id = 'botPanel';

                this.onOffSwitches = document.createElement('div');
                this.onOffSwitches.classList.add('onOffSwitches');

                createBtn('btn', 'ON/OFF', ['bot--btn', 'bot--switch'],
                    e => {
                        bot.toggle();
                    }, 'onOffSwitches');
                createBtn('queueBtn', 'Queue', ['bot--btn', 'btn-on', 'onOffSpecific'],
                    e => {
                        bot.onOffSpecific('queue');
                    }, 'onOffSwitches');
                createBtn('conditsBtn', 'Condits', ['bot--btn', 'btn-on', 'onOffSpecific'],
                    e => {
                        bot.onOffSpecific('conds');
                    }, 'onOffSwitches');

                this.all.appendChild(this.onOffSwitches);

                createCheckbox('loopDiv', 'loopBox', 'setLoop', 'Loop/Repeat ', true);
                createCheckbox('replyDiv', 'replyBox', 'setReply', 'Reply Mode ', false, false, (chked) => {
                    this.replyAllDiv.classList.toggle('unactive');
                    this.replyAllBox.disabled = !chked;
                });
                createCheckbox('replyAllDiv', 'replyAllBox', 'setReplyAll', 'Send whole queue', false, true);
                addIdAndClasses(this.replyAllDiv, null, ['bot--box-l2', 'unactive']);
                createCheckbox('randomDiv', 'randomBox', 'setRandom', 'Random');
                createCheckbox('realTypeDiv', 'realTypeBox', 'setRealType', 'Real Type™');
                createCheckbox('fakeTypeDiv', 'fakeTypeBox', 'setFakeType', 'Fake Typing');

                createRange('rate', 'bot--rate', 'rateText', 'Send once/<span id="bot--rate-gauge">' + bot.rate + 'ms</span>', 'rateController', 'bot--rate-controller', 0, 10000, bot.rate, 1,
                    e => {
                        let rate = e.target.value;
                        bot.changeRate(rate);
                    });
                setTimeout(() => this.rateGauge = document.querySelector('#bot--rate-gauge'), 0);

                createBtn('btnAutoNext', 'Auto Next', ['bot--btn', 'bot--auto-next'],
                    e => {
                        bot.toggleAutoNext();
                    });
                this.btnAutoNext.title = 'If enabled, bot will automatically start another chat when other chatter disconnects.';
                // ################################################################################################
                createBtn('conditsSwitch', 'conditionals >', ['bot--condits-switch', 'bot--btn'], this.handleConditsSwitch.bind(this));

                appendElWithText('beginLabel', ['begin-label'], 'Start chat with: ', 'all', 'span');
                this.beginInput = document.createElement('input');
                this.beginInput.classList.add('begin');
                this.beginInput.placeholder = 'Message';
                createParentDivAndAppend('beginDiv', ['beginLabel', 'beginInput'])
                this.beginDiv.classList.add('begin-div');

                const createSelect = (parentDiv, parentClasses, select, optionsArr, label, selectFn) => {
                    this[parentDiv] = document.createElement('div');
                    this[parentDiv].classList.add(...parentClasses);
                    this[select] = document.createElement('select');

                    for (let i = 0; i < optionsArr.length; i++) {
                        const opt = document.createElement('option');

                        opt.appendChild(document.createTextNode(optionsArr[i]));
                        opt.value = optionsArr[i];
                        this[select].appendChild(opt);
                    }
                    this[parentDiv].appendChild(document.createTextNode(label));
                    this[parentDiv].appendChild(this[select]);

                    this[select].addEventListener('change', selectFn);
                }

                //##############################################################################################################################

                createParentDivAndAppend('tempCondForm', ['conditsSwitch']);
                addIdAndClasses(this.tempCondForm, null, ['bot--container']);

                this.condIfInput = document.createElement('input');
                this.condIfInput.placeholder = 'can be RegEx (eg. /regex/)';
                this.condIfInput.required = true;
                this.condIfLabel = document.createTextNode('IF: ');
                this.condThenInput = document.createElement('input');
                this.condThenInput.required = true;
                this.condThenLabel = document.createTextNode('THEN: ');

                createSelect('condTemplates', ['bot--cond-templates'], 'selectCondTemplate', ['NONE', 'fake k/m17'], 'Template ', e => {
                    bot.text.setTemplate(e.target.value);
                });
                createParentDivAndAppend('condTemplatesDiv', ['condTemplates']);
                this.condTemplatesDiv.classList.add('templates-modes-div');
                createParentDivAndAppend('condIfDiv', ['condIfLabel', 'condIfInput']);
                createParentDivAndAppend('condThenDiv', ['condThenLabel', 'condThenInput']);

                createBtn('removeCondsBtn', 'X', ['bot--btn'], e => {
                    bot.text.removeQueue();
                });

                this.removeCondsBtn.type = 'button';
                this.removeCondsBtn.title = 'Clear list of conditionals.';

                const sub = document.createElement('input');
                sub.type = 'submit';
                sub.classList.add('necessary_submit');

                createParentDivAndAppend('condControl', ['condIfDiv', 'condThenDiv', 'removeCondsBtn', sub]);
                this.condControl.classList.add('bot--list-control');

                this.condList = document.createElement('div');
                this.condList.classList.add('bot--list');
                this.condList.addEventListener('mouseup', e => {
                    handleBtns(e.target);
                    // if(e.target.closest('.bot-remove'))
                    //     bot.text.removeMessage(e.target.closest('.bot--queue-item').dataset.id);
                });

                createParentDivAndAppend('condForm', ['condTemplatesDiv', 'condControl', 'condList'], 'all', 'form');
                this.condForm.classList.add('cond-form', 'unactive-form');
                
                this.condForm.addEventListener('submit', e => {
                    e.preventDefault();
                    const ifval = this.condIfInput.value;
                    const thenval = this.condThenInput.value;
                    
                    bot.text.addMessage(constructCond(ifval, thenval));

                    this.condIfInput.value = this.condThenInput.value = '';
                });

                //#############################################################################################

                this.addToList = document.createElement('input');
                this.addToList.placeholder = 'Add to message queue';
                this.addToList.setAttribute('style', 'width: 80%');

                createBtn('resetQueueBtn', 'R', ['bot--btn'], e => {
                    bot.text.reset();
                });
                this.resetQueueBtn.title = 'Start from first message.';

                createBtn('removeQueueBtn', 'X', ['bot--btn'], e => {
                    bot.text.removeQueue();
                });
                this.removeQueueBtn.id = 'bot--remove-queue';
                this.removeQueueBtn.title = 'Clear the queue of messages.';

                this.upperDiv = document.createElement('div');
                this.upperDiv.classList.add('bot--list-control');
                this.upperDiv.appendChild(this.addToList);
                this.upperDiv.appendChild(this.resetQueueBtn);
                this.upperDiv.appendChild(this.removeQueueBtn);

                this.list = document.createElement('div');
                this.list.classList.add('bot--list');

                let editingListItemId = null;
                body.addEventListener('mousedown', e => {

                    if(!e.target.classList.contains('editInput')) {
                        
                        if (!e.target.closest('.editBtn')){
                            bot.text.updateListItem(editingListItemId);
                        }
                        if(editingListItemId){
                            bot.text.updateListItem(editingListItemId);
                            editingListItemId = null;
                        }
                    }
                })

                const handleBtns = (target) => {
                    const item = target.closest('.bot--queue-item');
                    
                    if(target.closest('.editBtn')){
                        setTimeout(() => {
                            const isCond = item.classList.contains('bot--cond-item');

                            const itemId = item.dataset.id;
                            const itemContent = isCond ? bot.text.condArr[itemId] : bot.text.textArr[itemId];
        
                            const form = document.createElement('form');
                            const inp = document.createElement('input');

                            let modifiedPart = null;
                            let elementToModify = null;
                            let modifiedPartContent = null;
                            if(isCond){
                                if (elementToModify = target.closest('.if-part')){
                                    modifiedPart = 'ifs';
                                    modifiedPartContent = itemContent.ifs;
                                } else {
                                    elementToModify = target.closest('.then-part');
                                    modifiedPart = 'thens';
                                    modifiedPartContent = itemContent.thens;
                                }
                                inp.value = modifiedPartContent[0];
                            } else {
                                elementToModify = item;
                                inp.value = itemContent;
                            }
                            inp.classList.add('editInput');
                            form.appendChild(inp);
                            elementToModify.innerHTML = '';
                            elementToModify.appendChild(form);
                            editingListItemId = itemId;
        
                            inp.focus();
        
                            form.addEventListener('submit', e => {
                                e.preventDefault();
        
                                const editedValue = inp.value;
                                let contentToReplace = editedValue;
                                if(isCond){
                                    let contentCopy = {...itemContent};
                                    contentCopy[modifiedPart][0] = editedValue;
                                    contentToReplace = contentCopy;
                                }
                                bot.text.edit(itemId, contentToReplace);
                                editingListItemId = null;
                            });
                        }, 0)
                    } else if(target.closest('.bot-remove')) {
                        bot.text.removeMessage(item.dataset.id);
                    }
                }

                this.list.addEventListener('click', e => {
                    handleBtns(e.target);
                });

                createSelect('modes', ['bot--modes'], 'selectMode', ['NONE', 'increment', 'parrot'], 'Mode ', e => {
                    bot.text.setMode(e.target.value);
                });
                createSelect('templates', ['bot--templates'], 'select', ['NONE', 'waves', 'Bałkanica'], 'Template ', e => {
                    bot.text.setTemplate(e.target.value);
                });

                createParentDivAndAppend('templatesModesDiv', ['modes', 'templates']);
                this.templatesModesDiv.classList.add('templates-modes-div');

                createParentDivAndAppend('listForm', ['templatesModesDiv', 'upperDiv', 'list'], 'all', 'form')
                this.listForm.addEventListener('submit', e => {
                    e.preventDefault();
                    
                    const msg = this.addToList.value;
                    bot.text.addMessage(msg);

                    this.addToList.value = '';
                });

                const imp = () => {
                    const sep = this.impSeparation.value;
                    const file = this.importFile.files;
                    const text = this.importInput.value;
                    const inp = text ? text : file;

                    bot.text.import(sep, inp);
                }

                this.expImp = document.createElement('div');
                this.exportDiv = document.createElement('div');

                this.importDiv = document.createElement('form');
                this.importDiv.classList.add('bot--import-div');
                this.importTop = document.createElement('div');
                this.importTop.classList.add('import-top')
                
                this.importDiv.addEventListener('submit', e => {
                    e.preventDefault();
                    imp();
                });
                this.expImp.classList.add('bot--expimp');
                createBtn('exportBtn', '< Export >', ['bot--btn', 'bot--export'],
                e => {
                    const name = this.expName.value;
                    bot.text.export(name);
                }, 'exportDiv');
                this.exportBtn.title = 'Export to file.';
                
                createBtn('importBtn', '> Import <', ['bot--btn', 'bot--import'],
                e => {
                    // imp();
                }, 'importTop');
                this.importBtn.title = 'Import from text or file.';
                
                this.expName = document.createElement('input');
                this.expName.placeholder = 'file name';
                this.expName.id = 'bot--expName';
                
                this.impSeparation = document.createElement('input');
                this.impSeparation.placeholder = 'sep.';
                this.impSeparation.id = 'bot--impSep';
                this.impSeparation.title = '(ONLY for importing text) Separation - eg. "," will split "i, like, pepper" to messages "i", "like" and "pepper"';
                
                this.importFile = document.createElement('input');
                this.importFile.classList.add('import-file');
                this.importFile.type = 'file';
                
                this.exportDiv.classList.add('bot--export-div');
                this.exportDiv.appendChild(this.expName);

                this.importTop.appendChild(this.impSeparation);
                this.importTop.appendChild(this.importFile);

                const makeInput = (labelText, required = false) => {
                    const label = makeEl('', labelText, 'span')
                    const input = makeEl('', '', 'input')
                    input.required = required;
                    
                    return {
                        input,
                        container: makeEl('input-container', [label, input])
                    }
                }

                const printResultMessage = (resultBox, msg, good = false) => {
                    resultBox.textContent = msg;
                    if(!good) resultBox.classList.add('wrong')
                    else resultBox.classList.remove('wrong')
                }

                // upload window and button
                (() => {
                    const nameInputObj = makeInput('Template name: ', true)
                    const resultMsgBox = makeEl('result-msg');
                    const windowContent = makeEl('upload-content', [nameInputObj.container, resultMsgBox], 'form')

                    const printResultMsg = printResultMessage.bind(null, resultMsgBox)
                    
                    createBtn('uploadBtn', '', ['bot--btn', 'icon-btn', 'upload-btn'], e => {
                        handleWindowActions(e, this.uploadWindow, ['.bot-window','.template-menu']);
                    }, 'exportDiv')

                    this.uploadBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M16 16h-3v5h-2v-5h-3l4-4 4 4zm3.479-5.908c-.212-3.951-3.473-7.092-7.479-7.092s-7.267 3.141-7.479 7.092c-2.57.463-4.521 2.706-4.521 5.408 0 3.037 2.463 5.5 5.5 5.5h3.5v-2h-3.5c-1.93 0-3.5-1.57-3.5-3.5 0-2.797 2.479-3.833 4.433-3.72-.167-4.218 2.208-6.78 5.567-6.78 3.453 0 5.891 2.797 5.567 6.78 1.745-.046 4.433.751 4.433 3.72 0 1.93-1.57 3.5-3.5 3.5h-3.5v2h3.5c3.037 0 5.5-2.463 5.5-5.5 0-2.702-1.951-4.945-4.521-5.408z"/></svg>'
                    const topBar = makeEl('top-bar', 'Upload template')

                    const uploadWindow = createParentDivAndAppend('uploadWindow', [topBar, windowContent], 'uploadBtn')
                    uploadWindow.classList.add('upload-window', 'bot-window', 'off')

                    createBtn('closeUpload', 'X', ['bot--btn'], e => {
                        this.uploadWindow.classList.add('off')
                    }, topBar)

                    createBtn('uploadTemp', 'Upload', ['bot--btn', 'upload-temp'], e => {
                        e.preventDefault()
                        const data = bot.text.packData();
                        const tempName = nameInputObj.input.value;
                        if(!tempName) return printResultMsg('You have to name your template.')
                        else this.uploadTemp.classList.add('inactive-btn')

                        fetch(backendUrl+'templates', {
                            method: 'POST',
                            credentials: 'include',
                            headers: {
                                'Content-type': 'application/json'
                            },
                            body: JSON.stringify({
                                name: tempName,
                                template: data
                            })
                            })
                            .then(async res => {
                                const data = await res.json()
                                
                                this.uploadTemp.classList.remove('inactive-btn')
                                if(res.ok){
                                    printResultMsg('Template created!', true)
                                } else if(data && data.msg){
                                    printResultMsg(data.msg)
                                } else {
                                    printResultMsg('Unknown error')
                                }
                            })
                            .catch(err => {
                                this.uploadTemp.classList.remove('inactive-btn')
                                printResultMsg(err)
                            });
                    }, windowContent)
                })();

                ///////////////////////////////////////////////////////////////////

                // search window and button
                (() => {
                    const fetchTemplates = (force = false) => {
                        if(!this.searchWindow.classList.contains('off') || force){
                            this.templatesResult.innerHTML = '';
                            this.templatesResult.appendChild(makeEl('bot-loading', 'Loading templates...'))
                            fetch(backendUrl+'templates')
                            .then(res => {
                                if(res.ok){
                                    return res.json()
                                } else {
                                    console.log(res);
                                }
                            })
                            .then(data => {
                                this.templatesResult.innerHTML = '';
                                const frag = document.createDocumentFragment();

                                for(item of data){
                                    const templatePeek = makeEl('template-peek')
                                    const tempName = makeEl('template-name', '', 'span')
                                    const name = item.name;
                                    tempName.textContent = name ? name : 'unknown';
                                    const tempAuthor = makeEl('template-author', (' by ' + (item.author ? item.author.name : 'unknown')), 'span')
                                    // there might be a problem if there is author object but no author.NAME in it
                                    if(item.template){
                                        const textArr = item.template.textArr;
                                        let peekString = textArr[0];

                                        for(let i=1; i<textArr.length; i++){
                                            if(i>5) break;
                                            const item = textArr[i];
                                            peekString = peekString + ', ' + item;
                                        }
                                        
                                        peekString = document.createTextNode(peekString)
                                        templatePeek.appendChild(peekString)
                                    }
                                    
                                    const templateTop = makeEl('template-top', [menuBtn.cloneNode(true), tempName, tempAuthor, applyBtn.cloneNode(true)])
                                    const template = makeEl('template', [templateTop, templatePeek]);
                                    template.dataset.id = item._id;
                                    frag.appendChild(template);
                                }

                                this.templatesResult.appendChild(frag)
                            });
                        }
                    }

                    createBtn('searchBtn', '', ['bot--btn', 'icon-btn', 'search-btn'], e => {
                        e.preventDefault()
                        handleWindowActions(e, this.searchWindow, ['.search-window', '.template-menu'], () => {
                            if(this.searchWindow.classList.contains('off')) fetchTemplates(true)
                        })
                    }, 'importTop')

                    this.searchBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M23.822 20.88l-6.353-6.354c.93-1.465 1.467-3.2 1.467-5.059.001-5.219-4.247-9.467-9.468-9.467s-9.468 4.248-9.468 9.468c0 5.221 4.247 9.469 9.468 9.469 1.768 0 3.421-.487 4.839-1.333l6.396 6.396 3.119-3.12zm-20.294-11.412c0-3.273 2.665-5.938 5.939-5.938 3.275 0 5.94 2.664 5.94 5.938 0 3.275-2.665 5.939-5.94 5.939-3.274 0-5.939-2.664-5.939-5.939z"/></svg>'
                    
                    const topBar = createParentDivAndAppend('topBar', [])
                    topBar.classList.add('top-bar')

                    const search = createParentDivAndAppend('search', [], 'topBar', 'input') // search bar
                    search.placeholder = 'Search for templates...'
                    createBtn('searchClose', 'X', ['close', 'bot--btn'], e => {
                        this.searchWindow.classList.add('off')
                    }, 'topBar')
                    createParentDivAndAppend('searchWindow', ['topBar'])
                    createParentDivAndAppend('templatesResult', [], 'searchWindow')
                    this.templatesResult.classList.add('templates-result')
                    const loadingTemplates = makeEl('bot-loading', 'Loading templates...')
                    this.templatesResult.appendChild(loadingTemplates)
                    fetchTemplates()

                    this.searchWindow.classList.add('search-window', 'bot-window', 'off')
                    this.searchBtn.appendChild(this.searchWindow)

                    const resultMsgBox = makeEl('result-msg')
                    const printResultMsg = printResultMessage.bind(null, resultMsgBox)

                    this.templatesResult.addEventListener('click', e => {
                        const tempEl = e.target.closest('.template')
                        printResultMsg('')
                        if(tempEl) tempEl.appendChild(resultMsgBox)

                        if(!tempEl) return
                        const tempId = tempEl.dataset.id;
                        let btnEl;

                        if(e.target.closest('.bot-temp-apply')){
                            fetch(backendUrl+'templates/' + tempId)
                            .then(async res => {
                                const data = await res.json()

                                if(res.ok){
                                    bot.text.import('', data.template, true)
                                    printResultMsg('Template applied!', true)
                                } else if (data.msg){
                                    printResultMsg(data.msg)
                                } else {
                                    printResultMsg('Cannot apply template - unknown error')
                                }
                            }).catch(err => {
                                printResultMsg(err)
                            })

                        } else if(btnEl = e.target.closest('.bot-temp-menu')){
                            if(e.target.closest('.template-menu')){
                                removeMenuWindow()
                                if(e.target.classList.contains('template-option')){
                                    fetch(backendUrl+'templates/' + tempId, {
                                        method: 'DELETE',
                                        credentials: 'include'
                                    })
                                    .then(async res => {
                                        const data = await res.json()
                                        
                                        if(res.ok){
                                            fetchTemplates()
                                        } else if (data.msg) {
                                            printResultMsg(data.msg);
                                        } else {
                                            printResultMsg('Cannot delete - unknown error')
                                        }
                                    }).catch(err => {
                                        printResultMsg(err)
                                    })
                                }
                            } else 
                                createMenuWindow(btnEl, tempId)
                        }
                    })
                    
                    let tempMenu = '';
                    let oldTempId = '';
                    const removeMenuWindow = () => {if(tempMenu) tempMenu.remove()}
                    const createMenuWindow = (btnEl, tempId) => {
                        removeMenuWindow()
                        if(tempId !== oldTempId){
                            deleteOption = makeEl(['template-option', 'option-delete'], 'Delete')
                            tempMenu = makeEl('template-menu', deleteOption)

                            btnEl.appendChild(tempMenu)
                            oldTempId = tempId;
                        } else oldTempId = ''
                    }

                    body.addEventListener('click', e => {
                        if(tempMenu){
                            if(!e.target.closest('.bot-temp-menu') && !e.target.closest('.template-menu')){
                                oldTempId = '';
                                tempMenu.remove();
                            }
                        }
                    })
                })()

                this.importDiv.appendChild(this.importTop)
                this.importInput = document.createElement('textarea');
                this.importInput.placeholder = 'Paste or type in some text to import';
                this.importDiv.appendChild(this.importInput);

                this.expImp.appendChild(this.exportDiv);
                this.expImp.appendChild(this.importDiv);
                this.all.appendChild(this.expImp);

                this.panel.appendChild(this.hideBtn);

                createBtn('sideSwitch', '<|>', ['top-btns', 'bot--btn', 'icon-btn', 'side-switch'], e => {
                    this.position = this.panel.classList.toggle('right')
                }, 'panel')
                this.sideSwitch.title = 'Change bot position (left/right)';
                this.sideSwitch.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 13v4l-6-5 6-5v4h3v2h-3zm9-2v2h3v4l6-5-6-5v4h-3zm-4-6v14h2v-14h-2z"/></svg>';
                const logInBtnPath = '<path d="M8 9v-4l8 7-8 7v-4h-8v-6h8zm2-7v2h12v16h-12v2h14v-20h-14z"/>';
                const userBtnPath = '<path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm7.753 18.305c-.261-.586-.789-.991-1.871-1.241-2.293-.529-4.428-.993-3.393-2.945 3.145-5.942.833-9.119-2.489-9.119-3.388 0-5.644 3.299-2.489 9.119 1.066 1.964-1.148 2.427-3.393 2.945-1.084.25-1.608.658-1.867 1.246-1.405-1.723-2.251-3.919-2.251-6.31 0-5.514 4.486-10 10-10s10 4.486 10 10c0 2.389-.845 4.583-2.247 6.305z"/>';

                // sign in up window
                (() => {
                    createBtn('userBtn', 'Sign in/Register', ['top-btns', 'bot--btn', 'icon-btn'], e => {
                        handleWindowActions(e, this[onWindow], '.bot-window')
                    }, 'panel')
                    
                    this.userBtn.title = 'Sign in/Register';
                    this.userBtn.innerHTML = '<svg xmlns="https://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8 9v-4l8 7-8 7v-4h-8v-6h8zm2-7v2h12v16h-12v2h14v-20h-14z"/></svg>';

                    const loginObj = makeInput('Login: ', 1)
                    const passObj = makeInput('Password: ', 1)
                    passObj.input.type = 'password';

                    createBtn('closeSign', 'X', ['bot--btn'], e => {
                        this.signWindow.classList.add('off')
                    })
                    
                    const resultMsgBox = makeEl('result-msg')
                    const printResultMsg = printResultMessage.bind(null, resultMsgBox)
                    const windowContent = makeEl('', [loginObj.container, passObj.container, resultMsgBox])

                    const signIn = makeEl(['sign-title'], 'Sign in');
                    const signUp = makeEl(['sign-title', 'active'], 'Register');
                    const signSwitch = makeEl(['bot--container', 'sign-switch'], [signUp, signIn]);
                    
                    let signSwitchState = 'up';
                    signSwitch.addEventListener('click', e => {
                        printResultMsg('')
                        signIn.classList.toggle('active')
                        signUp.classList.toggle('active')

                        if(signSwitchState === 'up'){
                            signSwitchState = 'in'
                            this.signBtn.textContent = 'Sign in';
                        } else {
                            signSwitchState = 'up'
                            this.signBtn.textContent = 'Register';
                        }
                    })
                    const topBar = makeEl('top-bar', [signSwitch, this.closeSign]);
                    createParentDiv('signWindow', [topBar, windowContent])
                    this.signWindow.classList.add('sign-window', 'bot-window')
                    this.signWindow.title = ''

                    createBtn('signBtn', 'Register', ['bot--btn', 'sign-btn'], e => {
                        const user = {
                            login: loginObj.input.value,
                            password: passObj.input.value
                        }
                        if(!user.login || !user.password){
                            printResultMsg('Please fill in fields.')
                            return
                        }
                        this.signBtn.classList.add('inactive-btn');

                        const url = backendUrl + 'users/' + (signSwitchState === 'up' ? 'register' : 'signin');
                        fetch(url, {
                            method: 'POST',
                            credentials: 'include',
                            headers: {
                                'Content-type': 'application/json'
                            },
                            body: JSON.stringify(user)
                        })
                        .then(async res => {
                            // const contentType = res.headers.get("content-type");
                            // if (contentType && contentType.indexOf("application/json") !== -1) { //register
                            const data = await res.json();

                            if(!res.ok){
                                printResultMsg(data.msg);
                            } else {
                                if(data.login){
                                    this.user.setLoggedState(data.login)
                                } else {
                                    printResultMsg(data.msg, true);
                                }
                            }
                            // }
                            this.signBtn.classList.remove('inactive-btn');
                        }).catch(err => {
                            printResultMsg(err);
                            this.signBtn.classList.remove('inactive-btn');
                        });
                    }, this.signWindow)

                    this.userBtn.appendChild(this.signWindow)
                })();

                let onWindow = 'signWindow';
                let offWindow = 'userWindow';
                this.user = {
                    login: null,
                    setLoggedState: function(login){
                        this.login = login;
                        logInOutAction()
                    }
                }

                const logInOutAction = () => {
                    if(this.user.login){
                        checkSignWindows()
                        offWindow = 'signWindow';
                        onWindow = 'userWindow';
                        setLoginTitle(this.user.login)
                        const oldSvg = this.userBtn.querySelector('svg');
                        oldSvg.innerHTML = userBtnPath;
                    } else {
                        checkSignWindows()
                        onWindow = 'signWindow';
                        offWindow = 'userWindow';
                        setLoginTitle('ur not supposed to be here...')
                        const oldSvg = this.userBtn.querySelector('svg');
                        oldSvg.innerHTML = logInBtnPath;
                    }
                }

                const checkSignWindows = () => {
                    const isClosed = this[onWindow].classList.contains('off')

                    if(!isClosed){
                        this[onWindow].classList.add('off')
                        this[offWindow].classList.remove('off')
                    }
                }

                const setLoginTitle = (login) => {
                    this.loginTitle.innerHTML = '';
                    this.loginTitle.appendChild(makeEl('', 'Account: ' + login))
                }

                const authCheck = () => {
                    fetch(backendUrl + 'users/authorize', {
                        method: 'POST',
                        credentials: 'include'
                    }).then(async res => {
                        const data = await res.json()
                        
                        if(data && data.login){
                            this.user.setLoggedState(data.login)
                        }
                    })
                };

                authCheck();

                // user window
                (() => {

                    const resultMsgBox = makeEl('result-msg')
                    const printResultMsg = printResultMessage.bind(null, resultMsgBox)

                    createBtn('closeUser', 'X', ['bot--btn'], e => {
                        this.userWindow.classList.add('off')
                    })
                    createParentDivAndAppend('loginTitle', [])
                    const topBar = makeEl('top-bar', [this.loginTitle, this.closeUser]);
                    
                    createParentDiv('userWindow', [topBar])
                    this.userWindow.classList.add('sign-window', 'bot-window', 'off')
                    this.userWindow.title = ''
                    
                    createBtn('logoutBtn', 'logout', ['bot--btn', 'sign-btn'], e => {
                        this.logoutBtn.classList.add('inactive-btn');
                        const url = backendUrl + 'users/logout'
                        fetch(url, {
                            method: 'POST',
                            credentials: 'include',
                        })
                        .then(async res => {
                            const data = await res.json();
                            
                            if(!res.ok){
                                printResultMsg(data.msg);
                            } else {
                                printResultMsg(data.msg, true);
                                this.user.setLoggedState(null)
                            }
                            this.logoutBtn.classList.remove('inactive-btn');
                        }).catch(err => {
                            printResultMsg(err);
                            this.logoutBtn.classList.remove('inactive-btn');
                        });
                    }, this.userWindow)
                    
                    this.userBtn.appendChild(this.userWindow)
                })()

                const checkClickBlacklist = (e, blacklist) => { // if anything that is on the blacklist is clicked then dont execute actions (in handleWindowActions)
                    const isClicked = (item) => e.target.closest(item)

                    if(Array.isArray(blacklist)){
                        for(let i=0; i<blacklist.length; i++){
                            if(isClicked(blacklist[i])) return false
                        }
                    } else if(isClicked(blacklist)) return false

                    return true
                }

                let nonSimultaneousWindows = [this.uploadWindow, this.searchWindow];
                const handleWindowActions = (e, window, clickBlacklist, actions = null) => {
                    // check blacklist and if event was emitted by a click
                    if(e.screenX && checkClickBlacklist(e, clickBlacklist)){
                        if(actions) actions()
                        const nonSim = nonSimultaneousWindows;
                        // close any windows that are in 'nonSimultaneousWindows' array
                        for(let i=0; i<nonSim.length; i++){
                            if(nonSim[i] !== window && !nonSim[i].classList.contains('off')) nonSim[i].classList.add('off')
                        }
                        if(window !== this[onWindow]) this[onWindow].classList.add('off')
                        return window.classList.toggle('off')
                    }
                }

                appendElWithText('title', ['bot--title'], 'BloonBot v' + bot.version, 'panel');
                // createParentDivAndAppend('mainBar', ['hideBtn', 'sideSwitch', 'userBtn', 'title'], 'panel');
                const mainBtnsContainer = makeEl(['bot--container'], [this.hideBtn, this.sideSwitch, this.userBtn])
                const mainTopBar = makeEl(['bot--container'], [mainBtnsContainer, this.title])

                this.panel.appendChild(mainTopBar);
                this.panel.appendChild(this.all);

                body.insertBefore(this.panel, body.firstChild);

                this.stylize();
            },

            handleConditsSwitch(e){
                this.conditsSwitch.textContent = bot.text.isConditsShown ? 'conditionals >' : '< queue';
                handleBtnClick(this.conditsSwitch, 'toggleCondits');
                
                this.listForm.classList.toggle('unactive-form');
                this.condForm.classList.toggle('unactive-form');
            },

            toggleHide(){
                if (this.isHidden) {
                    this.hideBtn.style.setProperty('background', 'red');
                    this.all.style.setProperty('display', 'flex');
                } else {
                    this.hideBtn.style.setProperty('background', 'green')
                    this.all.style.setProperty('display', 'none');
                }
                this.isHidden = !this.isHidden;
            },

            stylize() {
                const css = `
                    #botPanel {
                        color: white;
                        padding: 10px;
                        z-index: 1000;
                        position: absolute;
                        width: 450px;
                        background: #000a;
                        box-sizing: border-box;
                        font-family: roboto, arial;
                    }

                    #botPanel.right {
                        right: 0;
                    }

                    #botPanel.right .bot-window {
                        right: 30px;
                        left: initial;
                    }

                    input, textarea {
                        box-sizing: border-box;
                    }
                    
                    #botPanel label *, #botPanel label {
                        cursor: pointer;
                    }
                    
                    .top-btns {
                        margin-left: 10px;
                        fill: white;
                    }

                    .side-switch {
                        padding: 2px !important;
                    }

                    .sign-window {
                        top: 0;
                        bottom: initial !important;
                    }

                    .sign-window .bot--btn {
                        margin-top: 10px;
                    }

                    .sign-title {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        padding: 5px;
                        border: 2px solid #aaa;
                        color: #aaa;
                        cursor: pointer;
                    }

                    .sign-title.active {
                        border: 2px solid white;
                        color: white;
                    }

                    .sign-title:nth-of-type(2) {
                        margin-left: 5px;
                    }

                    .inactive-btn {
                        background: #666 !important;
                    }

                    .inactive-btn::after {
                        content: '...'
                    }

                    .input-container {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .sign-window .input-container {
                        margin-top: 5px;
                    }

                    .input-container input {
                        flex: 1;
                        margin-left: 5px;
                    }

                    .result-msg {
                        color: #6f6;
                        margin-top: 5px;
                    }

                    .result-msg.wrong {
                        color: #f66;
                    }

                    .form-input-label {
                        margin-top: 0 !important;
                    }

                    .bot--title {
                        display: inline-block;
                        right: 10px;
                        color: #fff8;
                        font-weight: bold;
                    }

                    #bot--all-without-hide-btn {
                        display: flex;
                        flex-flow: column;
                        justify-content: center;
                        margin: 10px 0 0;
                    }

                    .bot--list {
                        max-height: 20vh;
                        overflow: auto;
                    }

                    .bot--container {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .bot--queue-item {
                        padding: 2px;
                        background: #fff9;
                        color: black;
                        border-top: 1px solid #777;
                        max-width: 100%;
                        overflow: hidden;
                        position: relative;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .bot--queue-item.bot--cond-item {
                        padding: 0px;
                    }

                    .bot--list-active-el {
                        background: #fffc;
                    }

                    .bot--list-active-el::after {
                        content: '';
                        position: absolute;
                        right: 0;
                        top: 0;
                        height: 100%;
                        width: 25px;
                        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' fill='%23f55' viewBox='0 0 640 640' shape-rendering='geometricPrecision' text-rendering='geometricPrecision' image-rendering='optimizeQuality' fill-rule='evenodd' clip-rule='evenodd'%3E%3Cpath d='M153.581 320L486.42 640.012V-.012L153.581 320z'/%3E%3C/svg%3E");
                        background-position: left;
                    }

                    #bot--list-control input, .bot--queue-item {
                        font-size: 15px;
                    }

                    #bot--rate {
                        margin: 10px 0;
                        color: white;
                    }

                    #bot--rate-controller {
                        cursor: pointer;
                        width: 100%;
                    }

                    #bot--rate-gauge {
                        font-weight: bold;
                    }

                    .onOffSwitches {
                        display: flex;
                    }

                    .onOffSwitches > * {
                        flex: 1 0 40px;
                    }

                    .bot--btn {
                        padding: 5px;
                        background: red;
                        color: white;
                        border: 2px solid white;
                        cursor: pointer;
                        font-weight: bold;
                    }

                    .bot--switch {
                        padding: 10px;
                        flex: 3 0 200px;
                    }

                    .bot--remove-queue {
                        padding: 2px 6px;
                    }

                    .bot--list-control {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin: 5px 0 5px;
                    }

                    .bot--expimp {
                        margin: 10px 0 5px;
                        display: flex;
                        justify-content: space-around;
                        flex-flow: column;
                    }

                    .bot--expimp input[type='file']{
                        width: 250px;
                        margin-left: 10px;
                    }

                    .import-top {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        height: 30px;
                        margin-top: 10px;
                    }

                    .bot--expimp input{
                        width: 100%;
                    }

                    .bot--expimp div {
                        margin-top: 10px;
                    }

                    .bot--import {
                        background: #8f8;
                        color: #080;
                    }

                    .bot--export {
                        background: #f88;
                        color: #800;
                    }

                    #bot--impSep {
                        width: 30px;
                    }

                    #bot--expName {
                        width: 60px;
                    }

                    .bot--export-div {
                        position: relative;
                    }

                    .upload-btn {
                        background: #f88;
                        fill: #800;
                        position: absolute !important;
                        right: 0;
                        top: 0;
                    }

                    .upload-content {
                        margin-top: 10px;
                    }

                    .upload-temp {
                        background: #f88;
                        color: #800;
                        grid-column: 2/4;
                        grid-row: end;
                        margin-top: 10px;
                    }

                    .search-btn {
                        background: #8f8;
                        fill: #080;
                    }
                    
                    .search-window {
                        height: 500px;
                    }

                    .icon-btn {
                        width: 30px;
                        height: 30px;
                        position: relative;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }

                    .icon-btn > svg {
                        width: 30px;
                    }

                    .bot-window {
                        position: absolute;
                        left: 40px;
                        bottom: 30px;
                        background: #000c;
                        width: 400px;
                        cursor: auto;
                        padding: 10px;
                        font-weight: normal;
                    }
                    
                    .bot-window .top-bar {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 1.2em;
                        font-weight: bold;
                    }
                    
                    .bot-window.off {
                        display: none;
                        pointer-events: none;
                    }
                    
                    .bot-window .close {
                        margin-left: 10px;
                    }

                    .templates-result {
                        overflow: auto;
                        height: 90%;
                    }
                    
                    .template {
                        background: #4448;
                        padding: 5px;
                        position: relative;
                    }
                    
                    .template-top {
                        margin-top: 0px !important;
                    }
                    
                    .template-name {
                        font-weight: bold;
                    }

                    .template-author {
                        color: #888;
                    }

                    .template-peek {
                        color: #bbb;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                        overflow: hidden;
                        margin-bottom: 5px;
                    }

                    .template .result-msg {
                        margin-top: 0;
                    }

                    .bot-temp-apply, .bot-temp-menu {
                        fill: white;
                        position: absolute;
                        cursor: pointer;
                    }
                    
                    .bot-temp-apply {
                        margin: 0 5px;
                        right: 0;
                    }

                    .bot-temp-menu {
                        left: 0;
                    }

                    .template-menu {
                        width: 100px;
                        left: 0;
                        top: 10px;
                        position: absolute;
                        background: #000a;
                        z-index: 1;
                    }

                    .template-option {
                        margin: 0 !important;
                        padding: 5px 0;
                        border-bottom: 1px solid #555;
                    }

                    textarea {
                        width: 100%;
                        resize: none;
                    }

                    .bot--box-l2 {
                        margin-left: 20px;
                    }

                    .bot--box-l3 {
                        margin-left: 30px;
                    }

                    #botPanel label.unactive {
                        color: #aaa;
                    }

                    .bot--condits-switch {
                        width: 35%;
                        background: #f55 !important;
                        margin-top: 10px;
                    }

                    #botPanel .btn-on {
                        background: green;
                    }

                    .unactive-form {
                        display: none;
                    }
                    
                    .cond-form .bot--list-control {
                        font-weight: bold;
                    }
                    
                    .cond-form input {
                        width: 100%;
                    }

                    .bot--cond-item {
                        display: flex;
                    }

                    .bot--cond-item > * {
                        width: 50%;
                        height: 100%;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        padding: 2px;
                    }

                    .then-part {
                        background: #f779;
                    }

                    .necessary_submit {
                        display: none;
                    }

                    .templates-modes-div {
                        margin-top: 10px;
                        display: flex;
                        justify-content: space-between;
                    }

                    .queue-icon {
                        margin-right: 6px;
                        cursor: pointer;
                    }

                    .editInput {
                        width: 100%;
                        box-sizing: border-box;
                    }

                    .invalid-item {
                        color: white;
                        background: #f22;
                    }

                    .begin-div {
                        margin-top: 10px;
                    }
                `;
                // active el - border: 1px solid #f55;

                const style = document.createElement('style');

                style.id = 'botStyle';

                if (style.styleSheet) {
                    style.styleSheet.cssText = css;
                } else {
                    style.appendChild(document.createTextNode(css));
                }

                const oldBotStyle = document.querySelector('#botStyle');

                oldBotStyle ? oldBotStyle.remove() : null;

                document.getElementsByTagName('head')[0].appendChild(style);
            }
        },

        text: {
            textArr: ['🎈'],
            initCondArr: [{
                ifs: ['m'],
                thens: ['k']
            }],
            input: '',
            counter: 0,
            oldCounter: 0,
            msgCounter: 0,
            isLoop: true,
            isReply: false,
            isReplyAll: false,
            isRandom: false,
            isRealType: false,
            isFakeType: false,
            fakeTypeRate: 300,
            initialRate: 500,
            itemPause: 800,
            mode: null,
            msg: '',
            isConditsShown: false,
            counters: ['counter', 'oldCounter'],
            firstCondSwitch: true,
            alreadyUsed: [],
            timesTrying: 0,

            startChat(){
                const msg = bot.cp.beginInput.value;
                
                if(msg){
                    setTimeout(() => {
                        this.insertMsg(msg);
                        bot.sendMsg();
                    }, 1000);
                }
            },

            edit(id, val){
                if(!this.isConditsShown)
                    this.textArr[id] = val;
                else
                    this.condArr[id] = val;
                this.updateList()
            },

            checkCond(){
                const strangerMsg = this.getStrangerMsg();
                if(strangerMsg){
                    const strMsg = strangerMsg.trim().toLowerCase();

                    for(let i=0; i<this.condListLength; i++){
                        const conds = this.condArr[i];
                        let ifCond = conds.ifs[0];
                        const thenCond = conds.thens[0];
                        // take testing to save it on object when updated
                        if(/^\/[\s\S]*\//.test(ifCond)){ // check if ifconditional is a regex
                            try {
                                const userReg = ifCond.replace(/^\/|\/$/g, '');
                                const reg = new RegExp(userReg); // can cause nothing to repeat error
                                const m = strMsg.match(reg);
                                
                                if(m ? m.length : 0){
                                    this.insertMsg(thenCond);
                                    bot.sendMsg();
                                }
                            } catch(err) {
                                console.log('Invalid RegEx: ', ifCond, err);
                                this.markInvalid(this.condList.children[i].children[0]);
                            }
                        } else {
                            ifCond = ifCond.trim().toLowerCase()
                            if(strMsg === ifCond){
                                this.insertMsg(thenCond);
                                break;
                            }
                        }
                    }
                    // bot.sendMsg();
                }
            },
            
            markInvalid(el){
                el.classList.add('invalid-item');
            },

            checkCounters(){
                for(const counterStr of this.counters){
                    this[counterStr] = (this[counterStr]+1 > this.listLength) ? 0 : this[counterStr];
                }
            },

            insert(forceFreshMsg = false) {
                if (this.listLength === 0) {
                    bot.stop();
                    alert('Empty queue!');
                } else {
                    this.checkCounters()

                    if (this.isRandom && !this.afterRandomChecked) {
                        if(forceFreshMsg){
                            let noFreshMsg = true;
                            l1:
                            for(let textArrId = 0; textArrId < this.listLength; textArrId++){
                                const msg = this.textArr[textArrId];
                                l2:
                                for(let usedId = 0; usedId < this.alreadyUsed.length; usedId++){
                                    const alreadyUsedMsg = this.alreadyUsed[usedId];
                                    if(msg !== alreadyUsedMsg){
                                        this.counter = textArrId;
                                        noFreshMsg = false;
                                        break l1;
                                    }
                                }
                            }

                            if(noFreshMsg){
                                this.alreadyUsed = [];
                            }
                        } else {
                            this.counter = Math.floor(Math.random() * this.listLength);
                        }
                    }

                    switch (this.mode) {
                        case 'parrot': {
                            this.insertMsg(this.getStrangerMsg());
                        }
                        break;

                        case 'increment': {
                            this.initialMsg = this.textArr[0];
                            this.msg += this.initialMsg;
                            this.insertMsg(this.msg);
                            this.msgCounter++;
                        }
                        break;

                        default: {
                            const msg = this.textArr[this.counter];
                            this.insertFromQueue(msg);
                        }
                    }

                    if (this.isRandom)
                        this.afterRandomChecked = false;
                
                    this.setActiveListEl();
                }
            },

            setActiveListEl(){
                this.checkCounters();

                if(this.listLength){
                    this.list.children[this.counter].classList.add('bot--list-active-el');

                    if (this.oldCounter !== this.counter)
                        this.list.children[this.oldCounter].classList.remove('bot--list-active-el');
                    this.oldCounter = this.counter;
                }
            },

            insertFromQueue(msg){
                let isAlreadyUsed = false;

                if(this.isRandom && !this.isLoop){ // no repeat when random
                    this.timesTrying++;
                    
                    if(this.timesTrying >= 4){ 
                        this.timesTrying = 0;
                        this.alreadyUsed = [];
                        this.insert();
                    } else { // try to use random message that hasn't been used 3 times, else select fresh msg
                        isAlreadyUsed = this.alreadyUsed.find(item => msg === item) ? true : false;
                        // console.log(isAlreadyUsed);
                        
                        if(isAlreadyUsed){
                            this.insert()
                        } else {
                            this.insertMsg(msg);
                        }
                    }
                } else {
                    this.insertMsg(msg);
                }

                if(!isAlreadyUsed){
                    if (!this.isRandom){
                        this.counter++;
                    }
                    
                    if (this.counter+1 > this.listLength) {
                        if (!this.isRandom) this.counter = 0;
                        if (!this.isLoop) bot.stop();
                    }

                    this.alreadyUsed.push(msg);
                    if(this.alreadyUsed.length >= this.listLength)
                        this.alreadyUsed = []
                }
            },

            insertMsg(msg) {
                const msgSplted = msg.split('$msg', 2);

                let msgFinal = '';
                if(msgSplted.length > 1){
                    msgFinal = msgSplted[0] + this.getStrangerMsg() + (msgSplted[1] ? msgSplted[1] : '');
                } else {
                    msgFinal = msgSplted[0];
                }

                this.input.value = msgFinal;
            },

            getStrangerMsg() {
                // if(bot.isLastMsgStrangers()){
                const strMsgEls = bot.log.querySelectorAll('.log-stranger');
                if(strMsgEls.length){
                    const strangerMsg = strMsgEls[strMsgEls.length-1].textContent;
                    return strangerMsg.replace(/Obcy:\s/, '');
                    // const strangerMsg = bot.log.lastChild.textContent;
                } else
                    return ''
            },

            setLoop(state) {
                this.isLoop = state;
            },

            setReply(state) {
                this.isReply = state;
            },

            setReplyAll(state) {
                this.isReplyAll = state;
            },

            setRandom(state) {
                this.isRandom = state;

                if (state) {
                    this.list.children[this.counter].classList.remove('bot--list-active-el');
                    this.counter = Math.floor(Math.random() * this.listLength);
                    this.list.children[this.counter].classList.add('bot--list-active-el');
                    this.afterRandomChecked = true;
                }
            },

            setRealType(state) {
                this.isRealType = state;

                if (!state) {
                    bot.changeRate(this.initialRate);
                } else {
                    bot.changeRate(1500, false, true);
                }
            },

            setFakeType(state) {
                this.isFakeType = state;

                if (!state)
                    clearInterval(bot.fakeTypeInterval);

                if (bot.isRunning) bot.start();
            },

            toggleCondits(state) {
                this.isConditsShown = !state;

                this.presentArr = state ? 'textArr' : 'condArr';
                this.presentList = state ? 'list' : 'condList';
                this.presentListLength = state ? 'listLength' : 'condListLength';

                if(this.firstCondSwitch){
                    this.updateList();
                    this.firstCondSwitch = false;
                }
            },

            realTypeSetup() {
                if (this.isRealType) {
                    const len = this.textArr[this.counter].length;

                    bot.changeRate(this.initialRate / 10 * len + this.itemPause, true);
                }
            },

            confirmListRemove(){
                if(this[this.presentListLength] > 1)
                    return confirm('This will clear the list of messages. Proceed?')
                else
                    return true
            },

            setTemplate(temp) {
                if(this.confirmListRemove()){
                    let arr = '';

                    if(!this.isConditsShown){
                        switch (temp) {
                            case 'waves':
                                arr = ["🎈", "🎈🎈", "🎈🎈🎈", "🎈🎈🎈🎈", "🎈🎈🎈🎈🎈", "🎈🎈🎈🎈", "🎈🎈🎈", "🎈🎈", "🎈"]
                                break;
                            case 'Bałkanica':
                                const text = 'Bałkańska w żyłach płynie krew,| kobiety, wino, taniec, śpiew.| Zasady proste w życiu mam,| nie rób drugiemu tego-| czego ty nie chcesz sam!| Muzyka, przyjaźń, radość, śmiech.| Życie łatwiejsze staje się.| Przynieście dla mnie wina dzban,| potem ruszamy razem w tan.| Będzie! Będzie zabawa!| Będzie się działo!| I znowu nocy będzie mało.| Będzie głośno, będzie radośnie| Znów przetańczymy razem całą noc.| Będzie! Będzie zabawa!| Będzie się działo!| I znowu nocy będzie mało.| Będzie głośno, będzie radośnie| Znów przetańczymy razem całą noc.| Orkiestra nie oszczędza sił| już trochę im brakuje tchu.| Polejcie wina również im| znów na parkiecie będzie dym.| Bałkańskie rytmy, Polska moc!| Znów przetańczymy całą noc.| I jeszcze jeden malutki wina dzban| i znów ruszymy razem w tan!| Będzie! Będzie zabawa!| Będzie się działo!| I znowu nocy będzie mało.| Będzie głośno, będzie radośnie| Znów przetańczymy razem całą noc.| Będzie! Będzie zabawa!| Będzie się działo!| I znowu nocy będzie mało.| Będzie głośno, będzie radośnie| Znów przetańczymy razem całą noc.|';
                                arr = text.split('|');
                                break;
                            default:
                                break;
                        }
                    } else {
                        switch (temp) {
                            case 'fake k/m17':
                                arr = [{
                                    "ifs": ["m"],
                                    "thens": ["k"]
                                }, {
                                    "ifs": ["k"],
                                    "thens": ["m"]
                                }, {
                                    "ifs": ["/.*lat.*/"],
                                    "thens": ["17"]
                                }, {
                                    "ifs": ["/.*m[\\d].*/"],
                                    "thens": ["k17"]
                                }, {
                                    "ifs": ["/.*k[\\d].*/"],
                                    "thens": ["m17"]
                                }, {
                                    "ifs": ["hej"],
                                    "thens": ["hej k"]
                                }, {
                                    "ifs": ["/^km.*/"],
                                    "thens": ["k"]
                                }]
                                break;
                            default:
                                break;
                        }
                    }
                    this.mutateTextArr(arr);
                }
                bot.cp.select.value = 'NONE';
            },

            setMode(mode, isAuto = false) {
                if (mode === 'parrot') {
                    this.mode = 'parrot';
                    const reply = bot.cp.replyBox;
                    if (!reply.checked)
                        reply.click();
                } else if (mode !== 'NONE')
                    this.mode = mode;
                else
                    this.mode = null;

                if(isAuto){
                    bot.cp.selectMode.value = mode;
                }

                this.reset();
            },

            mutateTextArr(newArr, forceMode = false) {
                if(!forceMode){
                    this[this.presentArr] = newArr;
                } else {
                    this[forceMode === 'queue' ? 'textArr' : 'condArr'] = newArr;
                }

                this.updateList(forceMode);
            },

            addMessage(msg) {
                if (msg) {
                    let finalItem = '';
                    if(!this.isConditsShown){
                        finalItem = msg.replace(/\s/g, '\xa0'); //\xa0
                    } else {
                        finalItem = msg;
                    }

                    const newArr = [...this[this.presentArr], finalItem];
                    this.mutateTextArr(newArr);
                }
            },

            removeMessage(id) {
                id = parseInt(id);

                this[this.presentArr].splice(id, 1);
                if(!this.isConditsShown){
                    if((this.counter !== 0) && (id !== this.counter) && (id < this.counter))
                        this.counter -= 1;
                    else if(id === this.counter)
                        this.reset();
                }
                this.updateList();
            },

            removeQueue() {
                if(this.confirmListRemove())
                    this.mutateTextArr(!this.isConditsShown ? ['🎈'] : [...this.initCondArr]);
            },

            updateListItem(id){
                if(!this.isConditsShown){
                    const itemElement = this.list.children[id];
                    if(itemElement){
                        itemElement.innerHTML = '';
                        const el = this.createListItem(this[this.presentArr][id]);
                        itemElement.appendChild(el);
                    }
                } else {
                    const itemElement = this.condList.children[id];
                    if(itemElement){
                        itemElement.innerHTML = '';
                        const el = this.createListItem(this[this.presentArr][id]);
                        itemElement.appendChild(el);
                    }
                }
            },

            createListItem(message, id = null, forceMode = false){
                
                if(forceMode ? forceMode === 'queue' : !this.isConditsShown){
                    let container = null;
                    if(typeof id !== 'number'){
                        container = document.createDocumentFragment();
                    } else {
                        container = document.createElement('div');
                        container.dataset.id = id;
                        container.classList.add('bot--queue-item');
                    }

                    const msg = document.createTextNode(message);
                    
                    const edBtn = editBtn.cloneNode(true);
                    const handle = handleBtn.cloneNode(true);
                    const remove = removeBtn.cloneNode(true);

                    container.appendChild(remove);
                    container.appendChild(handle);
                    container.appendChild(edBtn);
                    container.appendChild(msg);

                    return container
                } else {
                    let container = null;
                    
                    if(typeof id !== 'number'){
                        container = document.createDocumentFragment();
                    } else {
                        container = document.createElement('div');
                        container.dataset.id = id;
                        container.classList.add('bot--queue-item', 'bot--cond-item');
                    }
                    
                    const ifPart = document.createElement('div');
                    const thenPart = document.createElement('div');

                    ifPart.classList.add('if-part');
                    thenPart.classList.add('then-part');

                    const handle = handleBtn.cloneNode(true);
                    const edBtn = editBtn.cloneNode(true);
                    const edThenBtn = edBtn.cloneNode(true);
                    const remove = removeBtn.cloneNode(true);
                    ifPart.appendChild(remove);
                    ifPart.appendChild(handle);
                    ifPart.appendChild(edBtn);
                    thenPart.appendChild(edThenBtn);

                    ifPart.appendChild(document.createTextNode(message.ifs[0])); //undefined ifs
                    thenPart.appendChild(document.createTextNode(message.thens[0]));

                    container.appendChild(ifPart);
                    container.appendChild(thenPart);

                    return container
                }
            },

            updateList(forceMode = false) {
                
                if(forceMode ? forceMode === 'queue' : !this.isConditsShown){
                    this.list.innerHTML = '';

                    const frag = document.createDocumentFragment();

                    this.textArr.map((item, id) => {
                        if (item && item !== ' ' && item !== '\n') {
                            const itemNode = this.createListItem(item, parseInt(id), forceMode);
                            frag.appendChild(itemNode);
                        } else {
                            this.textArr.splice(id, 0);
                        }

                        this.list.appendChild(frag);
                    });

                    this.listLength = this.textArr.length;
                    this.checkCounters()
                    this.setActiveListEl();
                } else {
                    this.condList.innerHTML = '';
                    const frag = document.createDocumentFragment();
                    
                    this.condArr.map((item, id) => {
                        const container = this.createListItem(item, id, forceMode)
                        frag.appendChild(container);
                    });
                    this.condList.appendChild(frag);

                    this.condListLength = this.condArr.length;
                }
            },

            reset() {
                if(!this.isConditsShown){
                    // this.setActiveListEl();
                    if (this.listLength) {
                        this.checkCounters();
                        this.list.children[this.counter+1 > this.listLength ? 0 : this.counter].classList.remove('bot--list-active-el');
                        this.list.children[0].classList.add('bot--list-active-el');
                    }
                    this.counter = this.oldCounter = this.msgCounter = 0;
                    this.msg = '';
                }
            },

            packData() {
                return {
                    settings: {
                        boxes: {
                            isLoop: this.isLoop,
                            isReply: this.isReply,
                            isReplyAll: this.isReplyAll,
                            isRandom: this.isRandom,
                            isRealType: this.isRealType,
                            isFakeType: this.isFakeType
                        },
                        switches: {
                            queue: bot.isQueueRunning,
                            conds: bot.isCondsRunning
                        },
                        rate: bot.rate,
                        mode: this.mode,
                        begin: bot.cp.beginInput.value
                    },
                      
                    textArr: this.textArr,
                    condArr: this.condArr
                }
            },

            export(fileName) {
                const data = this.packData();

                download(JSON.stringify(data), (fileName ? fileName : this.textArr[0]) + '.json', 'text/plain');
            },

            import(sep, input, isJSON = false) {
                const isPlainText = (typeof input === 'string');

                const splitText = (text) => {
                    if (sep === '\\n')
                        sep = '\n';

                    const arr = text.split(sep);
                    this.mutateTextArr(arr);
                }

                if (!isPlainText) {
                    
                    const processData = (data) => {
                        if(!data){
                            alert('Unable to apply template. Not enough template data.')
                            return
                        }

                        this.mutateTextArr(data.textArr, 'queue');
                        this.mutateTextArr(data.condArr, 'conds');
                        // if(!data.settings.switches.queue && data.settings.switches.conds){
                            //     if(!this.isConditsShown){
                                //         // bot.cp.handleConditsSwitch();
                                //     }
                                // }
                                
                                const keys = Object.keys(data.settings.boxes);
                                const vals = Object.values(data.settings.boxes);
                                const cp = bot.cp;
                                
                                for(let i=0; i<keys.length; i++){
                                    const key = keys[i];
                                    const val = vals[i];
                                    
                                    if(this[key] !== val){
                                        const noIsKey = key.slice(2,3).toLowerCase() + key.slice(3);
                                const box = noIsKey+'Box';
                                const boxEl = cp[box];
                                boxEl.click();
                            }
                        }
                        
                        const begin = data.settings.begin;
                        bot.cp.beginInput.value = begin ? begin : '';
                        
                        bot.changeRate(data.settings.rate, false, true);
                        this.setMode(data.settings.mode, true);
                        
                        const switches = data.settings.switches;
                        bot.onOffSpecific('queue', switches.queue);
                        bot.onOffSpecific('conds', switches.conds);
                    }
                    
                    if(isJSON){
                        processData(input);
                        return
                    }

                    const processFile = (e) => {
                        const text = e.target.result;
                        const data = JSON.parse(text);
                        processData(data);
                    }

                    if (!window.FileReader) {
                        alert('Your browser is not supported');
                        return false;
                    }
                    // Create a reader object
                    var reader = new FileReader();
                    if (input.length) {
                        var textFile = input[0];
                        // Read the file
                        reader.readAsText(textFile);
                        // When it's loaded, process it
                        reader.addEventListener('load', processFile);

                    } else {
                        alert('Please upload a file or enter some text before continuing')
                    }
                } else {
                    splitText(input);
                }
            },

            init() {
                this.input = bot.inp;
                this.list = bot.cp.list;
                this.listLength = this.list.length;
                this.condList = bot.cp.condList;
                this.initialRate = bot.rate;
                this.condArr = this.initCondArr;

                this.presentArr = 'textArr';
                this.presentList = 'list';
                this.presentListLength = 'listLength';

                setTimeout(() => {
                    this.updateList();
                }, 0);
            }
        },

        start() {
            this.stop();

            this.cp.btn.style.setProperty('background', 'green');

            this.text.realTypeSetup();

            // if(this.isCondsRunning){
            //     this.condInterval = setInterval(() => {
            //         this.text.checkCond();
            //     }, this.condRate);
            // }
            if(this.isQueueRunning){
                if (this.text.isFakeType) {
                    let state = 1;
                    this.fakeTypeInterval = setInterval(() => {
                        state++;
                        if (state > 3) state = 1;

                        let ftmsg = 'Faking typing.';
                        switch (state) {
                            case 2:
                                ftmsg += '.';
                                break;
                            case 3:
                                ftmsg += '..';
                                break;
                        }
                        this.text.insertMsg(ftmsg);

                    }, this.text.fakeTypeRate);
                }
            }
            
            this.botInterval = setInterval(() => {
                this.runSetup();
            }, this.rate);

            this.isRunning = true;
        },

        stop() {
            if (this.isRunning) {
                this.cp.btn.style.setProperty('background', 'red')
                clearInterval(this.botInterval);
                clearInterval(this.fakeTypeInterval);
                // clearInterval(this.condInterval);
                this.botInterval = 0;
                this.fakeTypeInterval = 0;
                this.isRunning = false;
            }
        },

        isLastMsgStrangers(){
            const lastMsg = this.log.lastChild;

            if(lastMsg){
                return lastMsg.classList.contains(this.strangerMsgClass);
            } else return false;
        },

        runSetup() {
            if(this.isCondsRunning){
                if(!this.text.isReply)
                    this.text.checkCond();
                else if (this.isLastMsgStrangers())
                    this.text.checkCond();
            }

            if(this.isQueueRunning){
                if (this.text.isReply) {
                    try {
                        if (this.isLastMsgStrangers() || (this.text.isReplyAll && this.text.counter > 0)) {
                            this.text.insert();
                            this.sendMsg();
                        }
                    } catch (err) {}
                } else {
                    this.text.insert();
                    this.sendMsg();
                }

                this.isFirstRun = false;

                if (this.text.isRealType) this.start();
            }
        },

        sendMsg() {
            // if(this.btn){
            this.btn.click();
            const confirmBtn = document.querySelector('.sd-interface button');
            confirmBtn ? confirmBtn.click() : null;
            // } else {
            //     this.inp.dispatchEvent(new Event('focus'));
            //     this.inp.dispatchEvent(new KeyboardEvent('keypress',{keyCode:13}));
            // }
        },

        leaveIfDisconnected() {
            if (this.btn.classList.contains('disabled') && this.isAutoNext) {
                this.btnEsc.click();
                if(!this.text.isRandom)
                    this.text.reset();

                this.text.startChat();
            }
        },

        toggle() {
            if (this.isRunning) {
                this.stop();
            } else {
                this.runSetup();
                this.start();
                this.isFirstRun = true;
            }
        },

        changeRate(rate, preserveOriginal = false, setVisualValue = false) {
            this.rate = rate;
            if (!preserveOriginal) {
                this.text.initialRate = rate;
                const time = (this.rate < 1000) ? (Math.floor(this.rate) + 'ms') : ((this.rate / 1000).toFixed(1) + 's');
                this.cp.rateGauge.textContent = time;
            }
            if(setVisualValue) this.cp.rateController.value = rate;

            if (this.isRunning)
                this.start();
        },

        toggleAutoNext() {
            if (this.isAutoNext) {
                this.cp.btnAutoNext.style.setProperty('background', 'red')
            } else {
                this.cp.btnAutoNext.style.setProperty('background', 'green')
            }

            this.isAutoNext = !this.isAutoNext;
        },

        onOffSpecific(mode = 'queue', force = null){
            const btn = mode === 'queue' ? 'queueBtn' : 'conditsBtn';
            const running = mode === 'queue' ? 'isQueueRunning' : 'isCondsRunning';
            const otherRunning = mode !== 'queue' ? 'isQueueRunning' : 'isCondsRunning';

            if(force !== this[running]){
                this.cp[btn].classList.toggle('btn-on');
                this[running] = !this[running];
                if(this.isRunning) this.start();
            }

            // if(this[otherRunning] !== this[running]){ // if one of switches is ON and if list shown is in state diffrent than this one running then switch them
            //     if(mode === 'queue'){
            //         if(this[running] === this.text.isConditsShown){
            //             this.cp.handleConditsSwitch();
            //         }
            //     } else {
            //         if(this[running] === !this.text.isConditsShown){
            //             this.cp.handleConditsSwitch();
            //         }
            //     }
            // }
        },

        init(inputQuery, btnQuery = null, btnEscQuery = null, messageAreaQuery = null, strangerMsgClass = null) {
            this.btn = btnQuery ? document.querySelector(btnQuery) : null;
            this.btnEsc = btnEscQuery ? document.querySelector(btnEscQuery) : null;
            this.inp = inputQuery ? document.querySelector(inputQuery) : null;
            this.log = messageAreaQuery ? document.querySelector(messageAreaQuery) : null;
            this.strangerMsgClass = strangerMsgClass;

            setInterval(() => {
                if(this.isRunning) this.leaveIfDisconnected();
            }, 1000);

            this.cp.init();
            this.text.init();
        },
    }

    window.bot = bot;
}
//6obcy
bot.init('#box-interface-input', 'button.o-any.o-send', 'button.o-any.o-esc', '#log-dynamic', 'log-stranger');

//e-chat.co
// bot.init('#InputTextArea', '#SendButton', 'null');
