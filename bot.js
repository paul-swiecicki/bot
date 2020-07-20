bot ? bot.stop() : 0;
{
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

    const isObjEmpty = (obj) => {
        return Object.keys(obj).length === 0 && obj.constructor === Object
    }

    const createSVG = (iconPath) => {
        const namespaceURI = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(namespaceURI, 'svg');
        const path = document.createElementNS(namespaceURI, 'path');
        path.setAttributeNS(null, "d", iconPath);
        svg.setAttributeNS(null, 'viewBox', "0 0 24 24");
        svg.appendChild(path)
        svg.classList.add('bot-svg-icon')
        return svg
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

        version: '0.3',
        devMode: true,
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
                        appendEl(child, el)
                        // if(typeof child === 'string'){
                        //     this[el].appendChild(this[child]);
                        // } else {
                        //     this[el].appendChild(child);
                        // }
                    }

                    return this[el]
                }

                const createParentDivAndAppend = (el, childEl, parentEl = 'all', elType = 'div') => { //childEl must be an array
                    this[el] = createParentDiv(el, childEl, elType);
                    appendEl(el, parentEl)
                    // this[parentEl].appendChild(this[el]);
                    
                    return this[el]
                }

                const appendChildrenElements = (parentEl, childrenEls) => {
                    if(!Array.isArray(childrenEls)) 
                        parentEl.appendChild(childrenEls)
                    else {
                        for (let i = 0; i < childrenEls.length; i++) {
                            const child = childrenEls[i]
                            if(child) parentEl.appendChild(child)
                        }
                    }
                }

                const makeEl = (classes = [], childElsOrText = '', elType = 'div') => {
                    el = document.createElement(elType)
                    
                    if(childElsOrText){
                        if(typeof childElsOrText === 'string'){
                            if(elType !== 'input') el.appendChild(document.createTextNode(childElsOrText));
                            else el.value = childElsOrText;
                        } else {
                            appendChildrenElements(el, childElsOrText)
                        }
                    }

                    if(Array.isArray(classes)) el.classList.add(...classes)
                    else if (classes) el.classList.add(classes)

                    return el
                }

                const createCheckbox = (parentEl, el, setFunction, label, title, checked = false, disabled = false, fn) => {
                    this[el] = document.createElement('input');
                    this[el].type = 'checkbox';
                    this[el].checked = checked;
                    this[el].disabled = disabled;
                    this[el].addEventListener('change', e => {
                        const chked = e.target.checked;
                        if(setFunction) bot.text[setFunction](chked);
                        if (fn) fn(chked)
                    });
                    
                    const labelEl = createParentDivAndAppend(parentEl, [el], 'options', 'label');
                    labelEl.title = title;
                    appendEl(document.createTextNode(label), parentEl)
                }

                const elThis = (el) => {
                    if(typeof el === 'string') return this[el]
                    return el
                }
                const appendEl = (el, parentEl) => { // tests both el and parentEl for being string
                    elThis(parentEl).appendChild(elThis(el))
                }

                const createBtn = (btn, content, classes, clickFn, parentEl = 'all') => {
                    const btnEl = document.createElement('button');
                    btnEl.classList.add(...classes);

                    if(typeof content === 'string'){
                        btnEl.appendChild(document.createTextNode(content));
                    } else {
                        if(content.iconPath){
                            const svg = createSVG(content.iconPath)
                            btnEl.appendChild(svg);
                        }
                        if(content.text) btnEl.appendChild(document.createTextNode(content.text));
                    }
                    
                    btnEl.onclick = clickFn;

                    if(parentEl)
                        appendEl(btnEl, parentEl)
                    
                    if(btn) this[btn] = btnEl; 

                    return btnEl
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

                    createParentDiv(parentEl, [label, controller])
                    this.rate.id = parentElId;
                    return parentEl
                }
                
                createBtn('hideBtn', 'HIDE', ['bot--btn', 'bot--hide-btn'],
                e => {
                    this.toggleHide();
                });
                
                let warningScreen = null;
                this.showAlert = (msg, { okBtnText: okBtnText = 'Ok', cancelBtnText: cancelBtnText = 'Cancel', onConfirm: onConfirm = null, onCancel: onCancel = null, okOnly: okOnly = false } = {}) => {
                    if(!msg) return
                    if(warningScreen) warningScreen.remove()

                    const info = makeEl('warning-info', msg)
                    const okBtn = makeEl(['warning-ok', 'bot--btn'], okBtnText);
                    okBtn.addEventListener('click', e => {
                        warningScreen.remove()
                        if(onConfirm) onConfirm(e)
                    })

                    let cancelBtn = null;
                    if(!okOnly){
                        cancelBtn = makeEl(['warning-cancel', 'bot--btn'], cancelBtnText);
                        cancelBtn.addEventListener('click', e => {
                            warningScreen.remove()
                            if(onCancel) onCancel()
                        })
                    }
                    const btns = makeEl('warning-btns', [okBtn, cancelBtn])

                    warningScreen = makeEl('warning-screen', [info, btns])
                    this.panel.appendChild(warningScreen)
                }

                this.panel = makeEl();
                this.panel.id = 'botPanel';

                this.onOffSwitches = makeEl('onOffSwitches');

                this.all.appendChild(this.onOffSwitches);

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

                const sections = [];
                const makeSection = (label, children) => {
                    return new Promise((resolve, reject) => {
                        setTimeout(() => {
                            let visibilitySwitch = null;
                            if(label){                            
                                visibilitySwitch = createBtn(null, {iconPath: 'M21 12l-18 12v-24z', text: label}, ['hide-section-btn'],
                                (e) => {
                                    const sectionContainer = e.target.closest('.section-container');
                                    const isHidden = !sectionContainer.classList.toggle('off');
                                    visibilitySwitch.title = (isHidden ? 'Hide this section' : 'Show this section')
                                    // if(!isHidden)
                                    //     this.manageWindowPos()
                                }, null)
                                visibilitySwitch.title = 'Hide this section';
                            }
                            const sectionContent = makeEl('section-content', children);
                            const section = makeEl(['section-container', (label ? 'with-border' : 'no-border')], [visibilitySwitch, sectionContent], 'section');
                            sections.push(section);

                            resolve(section);
                        }, 0);
                    })
                }

                const makeAndAppendSection = async (label, ...children) => {
                    const section = await makeSection(label, children);
                    this.all.appendChild(section);
                    return section
                }

                const makeSwitch = ({ flickTexts: [ text1='1', text2='2' ], classes = [], onSwitch = ()=>{} }) => {
                    const flick1 = makeEl(['bot-flick', 'active'], text2);
                    const flick2 = makeEl(['bot-flick'], text1);
                    const switchContainer = makeEl([...classes, 'bot--container', 'bot-switch'], [flick1, flick2]);
                    
                    switchContainer.addEventListener('click', e => {
                        const classList = e.target.classList;
                        if(!classList.contains('active') && classList.contains('bot-flick')){
                            const state = flick1.classList.toggle('active')
                            flick2.classList.toggle('active')

                            onSwitch(state)
                        }
                    })
                    return switchContainer
                }

                const makeInput = (labelText, required = false, placeholder) => {
                    const label = makeEl('', labelText, 'span')
                    const input = makeEl('', '', 'input')
                    input.required = required;
                    if(placeholder) input.placeholder = placeholder;
                    
                    return {
                        input,
                        label,
                        container: makeEl('input-container', [label, input])
                    }
                }

                setTimeout(() => {
                    makeAndAppendSection('Chat starting & ending', this.btnAutoNext, this.beginDiv);
                    makeAndAppendSection('Text messages', this.conditsSwitch, this.listForm, this.condForm);
                    makeAndAppendSection('Message sending options', this.options, this.rate);
                    makeAndAppendSection('Exporting & importing', this.serverBar, this.expImp);
                    makeAndAppendSection(null, this.updateToolbar);
                }, 0);

                this.options = makeEl('bot-options')

                createCheckbox('loopDiv', 'loopBox', 'setLoop', 'Loop/Repeat ', 'When last message in queue is send, then start from the beginning of queue. \n If random is checked, repeated messages will be allowed.', true);
                createCheckbox('replyDiv', 'replyBox', 'setReply', 'Reply Mode ', 'Bot will send a message only when other chatter sends a message', false, false, (chked) => {
                    this.replyAllDiv.classList.toggle('unactive');
                    this.replyAllBox.disabled = !chked;
                });
                createCheckbox('replyAllDiv', 'replyAllBox', 'setReplyAll', 'Send whole queue', 'When replying bot will send entire queue at once', false, true);
                this.replyAllDiv.classList.add('bot--box-l2', 'unactive');
                createCheckbox('randomDiv', 'randomBox', 'setRandom', 'Random', 'Messages from queue will be chosen randomly');
                createCheckbox('realTypeDiv', 'realTypeBox', 'setRealType', 'Real Type™', 'Bot will try to imitate typing of real human - longer messages will take longer to send');
                createCheckbox('fakeTypeDiv', 'fakeTypeBox', 'setFakeType', 'Fake Typing', 'Bot will imitate typing - useful when your chatting website shows when other chatter is typing something');

                createRange('rate', 'bot--rate', 'rateText', 'Send once/', 'rateController', 'bot--rate-controller', 0, 10000, bot.rate, 1,
                    e => {
                        let rate = e.target.value;
                        bot.changeRate(rate);
                    }
                );
                this.rateGauge = makeEl(null, bot.rate + 'ms', 'span');
                this.rateGauge.id = "bot--rate-gauge";
                this.rateText.appendChild(this.rateGauge)
                
                // setTimeout(() => this.rateGauge = document.querySelector('#bot--rate-gauge'), 100);
                
                createBtn('btnAutoNext', 'Auto Next', ['bot--btn', 'bot--auto-next'],
                    e => {
                        bot.toggleAutoNext();
                    }, null);
                this.btnAutoNext.title = 'If enabled, bot will automatically start another chat when other chatter disconnects.';
                // ################################################################################################
                
                this.beginLabel = makeEl('begin-label', 'Start chat with: ', 'span')
                this.beginInput = makeEl('begin', null, 'input')
                this.beginInput.placeholder = 'Message';
                this.beginDiv = makeEl(['begin-div', 'input-container'], [this.beginLabel, this.beginInput])
                
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
                let warned = false
                this.conditsSwitch = makeSwitch({
                    flickTexts: ['Conditionals', 'Queue'],
                    classes: ['bot-condits-switch'],
                    onSwitch: (state) => {
                        this.listForm.classList.toggle('unactive-form');
                        this.condForm.classList.toggle('unactive-form');
                        bot.text.toggleCondits(state)

                        if(!warned){
                            const closeWarning = makeEl('bot-close-warning', 'x', 'span');
                            closeWarning.addEventListener('click', e => {
                                e.target.parentElement.classList.add('closed')
                            })
                            const warning = makeEl('bot-warning', [
                                makeEl(null, 'Settings in this section affect ONLY queue', 'span'),
                                closeWarning
                            ])
                            this.options.prepend(warning)
                            warned = true
                        }
                    }
                })

                this.condIf = makeInput('IF: ', true, 'can be a RegEx (eg. /regex/)')
                this.condThen = makeInput('THEN: ', true)
                createBtn('removeCondsBtn', 'X', ['bot--btn'], e => {
                    bot.text.removeQueue();
                });

                this.removeCondsBtn.type = 'button';
                this.removeCondsBtn.title = 'Clear list of conditionals.';

                const sub = document.createElement('input');
                sub.type = 'submit';
                sub.classList.add('necessary_submit');

                this.condControl = makeEl(['bot--list-control', 'cond-control'], [this.condIf.container, this.condThen.container, this.removeCondsBtn, sub])

                this.condList = document.createElement('div');
                this.condList.classList.add('bot--list');
                this.condList.addEventListener('mouseup', e => {
                    handleBtns(e.target);
                });

                createParentDivAndAppend('condForm', ['condControl', 'condList'], 'all', 'form');
                this.condForm.classList.add('cond-form', 'unactive-form');
                
                this.condForm.addEventListener('submit', e => {
                    e.preventDefault();
                    const ifval = this.condIf.input.value;
                    const thenval = this.condThen.input.value;
                    
                    bot.text.addMessage(constructCond(ifval, thenval));

                    this.condIf.input.value = this.condThen.input.value = '';
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

                createParentDivAndAppend('templatesModesDiv', ['modes']);
                this.templatesModesDiv.classList.add('templates-modes-div');

                createParentDivAndAppend('listForm', ['templatesModesDiv', 'upperDiv', 'list'], 'all', 'form')
                this.listForm.addEventListener('submit', e => {
                    e.preventDefault();
                    
                    const msg = this.addToList.value;
                    bot.text.addMessage(msg);

                    this.addToList.value = '';
                });

                const imp = () => {
                    this.showAlert('This will clear your messages in queue. Proceed?', {
                        okBtnText: 'Clear and import',
                        onConfirm: () => {
                            const sep = this.impSeparation.value;
                            const file = this.importFile.files;
                            const text = this.importInput.value;
                            const inp = text ? text : file;
        
                            bot.text.import(sep, inp, false, true);
                        }
                    })
                }

                this.importDiv = document.createElement('form');
                this.importDiv.classList.add('bot--import-div');
                
                this.importDiv.addEventListener('submit', e => {
                    e.preventDefault();
                    imp();
                });
                createBtn('exportBtn', '< Export (Download) >', ['bot--btn', 'bot--export'],
                e => {
                    const name = this.expName.value;
                    bot.text.export(name);
                }, null);
                this.exportBtn.title = 'Download template file';
                
                
                this.expName = document.createElement('input');
                this.expName.placeholder = 'file name';
                this.expName.id = 'bot--expName';
                
                this.impSeparation = document.createElement('input');
                this.impSeparation.placeholder = 'sep.';
                this.impSeparation.id = 'bot--impSep';
                this.impSeparation.title = 'Separation (ONLY for importing text) - for example separator "," will split "i, like, pepper" to messages in queue "i", "like" and "pepper"';
                
                this.importFile = document.createElement('input');
                this.importFile.classList.add('import-file');
                this.importFile.type = 'file';

                const printResultMessage = (resultBox, msg, good = false) => {
                    if(!resultBox.classList.contains('result-msg')){
                        const resultBoxToAppend = makeEl('result-msg');
                        resultBox.appendChild(resultBoxToAppend);

                        resultBox = resultBoxToAppend;
                    }

                    resultBox.textContent = msg;
                    if(!good) resultBox.classList.add('wrong')
                    else resultBox.classList.remove('wrong')
                }

                // upload window and button
                (() => {
                    this.uploadSettings = {
                        private: false
                    };

                    const nameInputObj = makeInput('Template name: ', true)
                    const resultMsgBox = makeEl('result-msg');

                    const privateLabel = makeEl('private-div', [], 'label');
                    createCheckbox(privateLabel, 'privateBox', null, 'Private', 'Only You will be able to see this template', false, false, (checked) => { 
                        this.uploadSettings.private = checked;
                    })

                    const windowContent = makeEl('upload-content', [nameInputObj.container, privateLabel, resultMsgBox], 'form')

                    const printResultMsg = printResultMessage.bind(null, resultMsgBox)
                    
                    createBtn('uploadBtn', {
                        text: 'Upload',
                        iconPath: 'M16 16h-3v5h-2v-5h-3l4-4 4 4zm3.479-5.908c-.212-3.951-3.473-7.092-7.479-7.092s-7.267 3.141-7.479 7.092c-2.57.463-4.521 2.706-4.521 5.408 0 3.037 2.463 5.5 5.5 5.5h3.5v-2h-3.5c-1.93 0-3.5-1.57-3.5-3.5 0-2.797 2.479-3.833 4.433-3.72-.167-4.218 2.208-6.78 5.567-6.78 3.453 0 5.891 2.797 5.567 6.78 1.745-.046 4.433.751 4.433 3.72 0 1.93-1.57 3.5-3.5 3.5h-3.5v2h3.5c3.037 0 5.5-2.463 5.5-5.5 0-2.702-1.951-4.945-4.521-5.408z'
                    }, ['bot--btn', 'icon-btn', 'upload-btn', 'server-btn'], e => {
                        handleWindowActions(e, this.uploadWindow, ['.bot-window','.template-menu']);
                    }, null)

                    const topBar = makeEl('top-bar', 'Upload template')

                    const uploadWindow = createParentDivAndAppend('uploadWindow', [topBar, windowContent], 'uploadBtn')
                    uploadWindow.classList.add('upload-window', 'bot-window', 'off')

                    createBtn('closeUpload', 'X', ['bot--btn', 'close'], e => {
                        this.uploadWindow.classList.add('off')
                    }, topBar)

                    this.uploadTemplate = (body, isInUploadWindow = true) => {
                        fetch(backendUrl+'templates', {
                            method: 'POST',
                            credentials: 'include',
                            headers: {
                                'Content-type': 'application/json'
                            },
                            body: JSON.stringify(body)
                        })
                        .then(async res => {
                            const data = await res.json()
                            
                            if(isInUploadWindow){
                                this.uploadTemp.classList.remove('inactive-btn')
                                if(res.ok){
                                    printResultMsg('Template created!', true)
                                } else if(data && data.msg){
                                    printResultMsg(data.msg)
                                } else {
                                    printResultMsg('Unknown error')
                                }
                            }
                        })
                        .catch(err => {
                            if(isInUploadWindow){
                                this.uploadTemp.classList.remove('inactive-btn')
                                printResultMsg(err)
                            }
                        });
                    }

                    createBtn('uploadTemp', 'Upload', ['bot--btn', 'upload-temp'], e => {
                        e.preventDefault();
                        const data = bot.text.packData();
                        const tempName = nameInputObj.input.value;
                        if(!tempName) return printResultMsg('You have to name your template.');
                        else this.uploadTemp.classList.add('inactive-btn');

                        this.uploadTemplate({
                            name: tempName,
                            private: this.uploadSettings.private,
                            template: data
                        })
                    }, windowContent)
                    
                })();

                ///////////////////////////////////////////////////////////////////

                // search window and button
                (() => {
                    this.searchParams = {}
                    this.editSearchParams = (params) => {
                        if(params.myTemplates){
                            if(params.myTemplates === 'toggle'){
                                const myTemplates = !this.myTemplates.classList.toggle('disabled-btn')
                                params.myTemplates = myTemplates ? 1 : 0;
                            } else if(params.myTemplates){
                                this.myTemplates.classList.remove('disabled-btn')
                            } else {
                                this.myTemplates.classList.add('disabled-btn')
                            }
                        }

                        this.searchParams = {
                            ...this.searchParams,
                            ...params
                        }
                    } 

                    this.fetchTemplates = (force = false) => {
                        if(!this.searchWindow.classList.contains('off') || force){
                            this.templatesResult.innerHTML = '';
                            this.templatesResult.appendChild(makeEl('bot-loading', 'Loading templates...'))

                            const createTemplate = (item, frag) => {
                                if(item){ 
                                    const templatePeek = makeEl('template-peek')
                                    const tempName = makeEl('template-name', '', 'div')
                                    const name = item.name;
                                    
                                    tempName.textContent = (name ? name : 'unknown');
                                    
                                    const tempAuthor = makeEl('template-author', (' by ' + (item.author ? item.author.name : 'unknown')), 'span');
                                    const timeSinceCreated = makeEl('template-author', ', '+item.timestamp, 'span');
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
                                    
                                    const menu = (this.user.login === item.author.name || this.user.permissions === 'all') 
                                    ? menuBtn.cloneNode(true) : null;
                                    
                                    const templateTop = makeEl('template-top', [menu, tempName, tempAuthor, timeSinceCreated, applyBtn.cloneNode(true)])
                                    const template = makeEl('template', [templateTop, templatePeek]);
                                    if(item.private){
                                        let privSvg = createSVG("M18 10v-4c0-3.313-2.687-6-6-6s-6 2.687-6 6v4h-3v14h18v-14h-3zm-10 0v-4c0-2.206 1.794-4 4-4s4 1.794 4 4v4h-8z")
                                        
                                        tempName.appendChild(privSvg)
                                        template.classList.add('private')
                                    }
                                    template.dataset.id = item._id;
                                    frag.appendChild(template);
                                }
                            }

                            const url = new URL(backendUrl+'templates')
                            if(!isObjEmpty(this.searchParams)){
                                url.search = new URLSearchParams(this.searchParams).toString()
                            }
                            fetch(url, {
                                credentials: 'include'
                            })
                            .then(async res => {
                                const data = await res.json()

                                this.templatesResult.innerHTML = '';
                                const frag = document.createDocumentFragment();
                                
                                if(!data.length){
                                    const noData = makeEl('bot-no-data', 'Nothing in here, but You can change it!')
                                    frag.appendChild(noData)
                                } else {
                                    for(item of data){
                                        createTemplate(item, frag)
                                    }
                                }

                                this.templatesResult.appendChild(frag)
                            }).catch(err => {
                                this.templatesResult.innerHTML = '';
                                printResultMessage(this.templatesResult, err)
                            })
                        }
                    }

                    createBtn('searchBtn', {
                        text: 'Browse',
                        iconPath: 'M23.822 20.88l-6.353-6.354c.93-1.465 1.467-3.2 1.467-5.059.001-5.219-4.247-9.467-9.468-9.467s-9.468 4.248-9.468 9.468c0 5.221 4.247 9.469 9.468 9.469 1.768 0 3.421-.487 4.839-1.333l6.396 6.396 3.119-3.12zm-20.294-11.412c0-3.273 2.665-5.938 5.939-5.938 3.275 0 5.94 2.664 5.94 5.938 0 3.275-2.665 5.939-5.94 5.939-3.274 0-5.939-2.664-5.939-5.939z'
                    }, ['bot--btn', 'icon-btn', 'search-btn', 'server-btn'], e => {
                        e.preventDefault()
                        const isWindowVisible = handleWindowActions(e, this.searchWindow, ['.search-window', '.template-menu'])

                        if(isWindowVisible) this.fetchTemplates()
                    }, null)
                    
                    const topBar = createParentDivAndAppend('topBar', [])
                    topBar.classList.add('top-bar')

                    createBtn('myTemplates', 'My templates', ['bot--btn', 'disabled-btn', 'bot-unshown'], e => {
                        this.editSearchParams({ myTemplates: 'toggle' })
                        this.fetchTemplates()
                    })
                    const filtersBar = makeEl('top-bar', [this.myTemplates])

                    const search = createParentDivAndAppend('search', [], 'topBar', 'input') // search bar
                    search.placeholder = 'Search for templates...'
                    let searchTimeout = null
                    search.addEventListener('input', e => {
                        const searchActions = () => { 
                            this.editSearchParams({
                                search: search.value
                            })
                            this.fetchTemplates()
                        }

                        if(searchTimeout) clearTimeout(searchTimeout)
                        searchTimeout = setTimeout(searchActions, 700)
                    })

                    createBtn('searchClose', 'X', ['close', 'bot--btn'], e => {
                        this.searchWindow.classList.add('off')
                    }, 'topBar')

                    const loadingTemplates = makeEl('bot-loading', 'Loading templates...')
                    this.templatesResult = makeEl('templates-result', [loadingTemplates])
                    this.searchWindow = makeEl(['search-window', 'bot-window', 'off'], [this.topBar, filtersBar, this.templatesResult])
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
                            applyTemplate(tempId)

                        } else if(btnEl = e.target.closest('.bot-temp-menu')){
                            if(e.target.closest('.template-menu')){
                                removeMenuWindow()
                                if(e.target.classList.contains('option-delete')){
                                    fetch(backendUrl+'templates/' + tempId, {
                                        method: 'DELETE',
                                        credentials: 'include'
                                    }).then(async res => {
                                        const data = await res.json()
                                        
                                        if(res.ok){
                                            this.fetchTemplates()
                                        } else if (data.msg) {
                                            printResultMsg(data.msg);
                                        } else {
                                            printResultMsg('Cannot delete - unknown error')
                                        }
                                    }).catch(err => {
                                        printResultMsg(err)
                                    })
                                } else if(e.target.classList.contains('option-edit')){
                                    this.updateTemplate('init', {
                                        el: tempEl,
                                        id: tempId
                                    })
                                }
                                oldTempId = false;
                            } else 
                                createMenuWindow(btnEl, tempId)
                        }
                    })
                    
                    const applyTemplate = async (tempId, isUpdating) => {
                        const applyPromise = () => {
                            return new Promise((resolve, reject) => {
                                fetch(backendUrl+'templates/' + tempId)
                                .then(async res => {
                                    const data = await res.json()
        
                                    if(res.ok){
                                        bot.text.import('', data.template, true)
                                        printResultMsg('Template applied!', true)
                                        resolve('success')
                                    } else {
                                        if (data.msg) printResultMsg(data.msg)
                                        else printResultMsg('Cannot apply template - unknown error')
                                        reject('wrong')
                                    }
                                }).catch(err => {
                                    printResultMsg(err)
                                    reject(err)
                                })
                            })
                        }

                        if(!isUpdating){
                            bot.cp.showAlert('This will clear your messages and settings. Proceed?', {
                                okBtnText: 'Clear and apply',
                                onConfirm(){
                                    return applyPromise()
                                }
                            })
                        } else {
                            return applyPromise()
                        }
                    }

                    this.updateTemplate = (mode, template = this.user.updatingTemplate) => {
                        if(template) {
                            let body = { mode };
                            let applyPromise;
                            const tempId = template.id || template._id;
                            if(mode === 'init'){
                                this.postAutoSave();
                                this.makeTemporarySave();
                                applyPromise = applyTemplate(tempId, true);
                            }
                            else if (mode === 'save'){
                                tempData = bot.text.packData();
                                
                                body = {
                                    ...body,
                                    template: tempData,
                                    private: this.privateSwitch.classList.contains('true'),
                                    name: this.tempUpdatingName.value
                                };
                                
                                setTimeout(_ => this.fetchTemplates(), 1000);
                            }

                            fetch(backendUrl+'templates/'+tempId, {
                                    method: 'PUT',
                                    credentials: 'include',
                                    headers: {
                                        'Content-type': 'application/json'
                                    },
                                    body: JSON.stringify(body)
                                }).then(async res => {
                                    Promise.all([res.json(), applyPromise])
                                        .then((vals) => {
                                            const data = vals[0];
                                            
                                            if(mode === 'init'){
                                                if(data && data.name){
                                                    this.user.setUpdating(data)
                                                    printResultMsg('Updating '+data.name, true)
                                                } else {
                                                    const msg = data.msg || 'Unknown error';
                                                    printResultMsg(msg)
                                                }
                                            } else if (mode === 'cancel' || mode === 'save'){
                                                this.updateCancel.classList.remove('inactive-btn')
                                                this.updateSave.classList.remove('inactive-btn')
                                                this.user.setUpdating(null);
                                                this.applyTemporarySave();
                                                
                                                const msg = data.msg || 'Updating cancelled';
                                                printResultMsg(msg, true)
                                            }
                                        }).catch(err => {
                                            this.user.setUpdating(null);
                                            printResultMsg(err)
                                        })
                                    }).catch(err => {
                                        this.user.setUpdating(null);
                                        printResultMsg(err)
                                    })
                        }
                    }

                    (() => {
                        const tempUpdatingLabel = makeEl('temp-update-label', 'Updating template:')
                        this.tempUpdatingName = makeEl('temp-update-name', '-', 'input')

                        this.privateSwitch = createSVG("M18 10v-4c0-3.313-2.687-6-6-6s-6 2.687-6 6v4h-3v14h18v-14h-3zm-10 0v-4c0-2.206 1.794-4 4-4s4 1.794 4 4v4h-8z");
                        this.privateSwitch.classList.add('private-switch');

                        const tempUpdatingEditables = makeEl('temp-updating-editables', [this.privateSwitch, this.tempUpdatingName])
                        tempUpdatingEditables.addEventListener('click', e => {
                            const target = e.target;
                            if(target.closest('.temp-update-name')){
                                
                            } else if(target.closest('.private-switch')){
                                this.user.switchPrivate();
                            }
                        })

                        const tempUpdating = makeEl('', [tempUpdatingLabel, tempUpdatingEditables])

                        createParentDivAndAppend('updateToolbar', [tempUpdating]);
                        this.updateToolbar.classList.add('update-toolbar')

                        createBtn('updateCancel', 
                            {text: 'Cancel', iconPath: "M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z"},
                            ['bot--btn'], e => {
                                this.updateCancel.classList.add('inactive-btn')
                                this.updateTemplate('cancel')
                            }, 'updateToolbar')

                        createBtn('updateSave',
                            {text: 'Save', iconPath: "M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"},
                            ['bot--btn'],
                            e => {
                                this.updateSave.classList.add('inactive-btn')
                                this.updateTemplate('save')
                            }, 'updateToolbar')
                        })()
                    
                    let tempMenu = false;
                    let oldTempId = false;
                    const removeMenuWindow = () => {
                        if(tempMenu) tempMenu.remove()
                    }
                    const createMenuWindow = (btnEl, tempId) => {
                        removeMenuWindow()
                        if(tempId !== oldTempId){
                            const deleteOption = makeEl(['template-option', 'option-delete'], 'Delete')
                            const editOption = makeEl(['template-option', 'option-edit'], 'Edit')
                            tempMenu = makeEl('template-menu', [editOption, deleteOption])

                            btnEl.appendChild(tempMenu)
                            oldTempId = tempId;
                        } else {
                            oldTempId = false
                        }
                    }

                    body.addEventListener('click', e => {
                        if(tempMenu){
                            if(!e.target.closest('.bot-temp-menu') && !e.target.closest('.template-menu')){
                                oldTempId = false;
                                tempMenu.remove();
                            }
                        }
                    })
                })()

                createBtn('importBtn', '> Import <', ['bot--btn', 'bot--import'],
                e => {
                    // imp();
                }, null);
                this.importBtn.title = 'Import from text or file';
                this.importTop = makeEl('import-top', [this.searchBtn, this.importBtn, this.impSeparation, this.importFile])

                this.importDiv.appendChild(this.importTop)
                this.importInput = document.createElement('textarea');
                this.importInput.placeholder = 'Paste, enter some text or choose a file, then click "import",';
                this.importDiv.appendChild(this.importInput);

                this.exportDiv = makeEl('bot--export-div', [this.uploadBtn, this.exportBtn, this.expName]);

                this.expImp = makeEl('bot--expimp', [this.exportDiv, this.importDiv])
                this.all.appendChild(this.expImp);

                this.panel.appendChild(this.hideBtn);

                createBtn('sideSwitch', '<|>', ['top-btns', 'bot--btn', 'icon-btn', 'side-switch'], e => {
                    this.position = this.panel.classList.toggle('right')
                }, this.panel)
                this.sideSwitch.title = 'Change bot position (left/right)';
                this.sideSwitch.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 13v4l-6-5 6-5v4h3v2h-3zm9-2v2h3v4l6-5-6-5v4h-3zm-4-6v14h2v-14h-2z"/></svg>';
                const logInBtnPath = '<path d="M8 9v-4l8 7-8 7v-4h-8v-6h8zm2-7v2h12v16h-12v2h14v-20h-14z"/>';
                const userBtnPath = '<path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm7.753 18.305c-.261-.586-.789-.991-1.871-1.241-2.293-.529-4.428-.993-3.393-2.945 3.145-5.942.833-9.119-2.489-9.119-3.388 0-5.644 3.299-2.489 9.119 1.066 1.964-1.148 2.427-3.393 2.945-1.084.25-1.608.658-1.867 1.246-1.405-1.723-2.251-3.919-2.251-6.31 0-5.514 4.486-10 10-10s10 4.486 10 10c0 2.389-.845 4.583-2.247 6.305z"/>';

                // sign in up window
                (() => {
                    createBtn('userBtn', 'Sign in/Register', ['top-btns', 'bot--btn', 'icon-btn'], e => {
                        handleWindowActions(e, this[onWindow], '.bot-window')
                    }, this.panel)
                    
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

                    let signSwitchState = 'Register';
                    const signSwitch = makeSwitch({
                        flickTexts: ['Sign in', 'Register'],
                        onSwitch: (state) => {
                            printResultMsg('')
                            const stateText = (state ? 'Register' : 'Sign in');
                            this.signBtn.textContent = stateText;
                            signSwitchState = stateText;
                        }
                    })

                    this.signForm = makeEl('sign-form', [windowContent], 'form')

                    const topBar = makeEl('top-bar', [signSwitch, this.closeSign]);
                    this.signWindow = makeEl(['sign-window', 'bot-window'], [topBar, this.signForm])
                    this.signWindow.title = ''

                    createBtn('signBtn', 'Register', ['bot--btn', 'sign-btn'], e => {
                        e.preventDefault()
                        printResultMsg('')

                        const user = {
                            login: loginObj.input.value,
                            password: passObj.input.value
                        }
                        if(!user.login || !user.password){
                            printResultMsg('Please fill in fields.')
                            return
                        }
                        this.signBtn.classList.add('inactive-btn');

                        const url = backendUrl + 'users/' + (signSwitchState === 'Register' ? 'register' : 'signin');
                        fetch(url, {
                            method: 'POST',
                            credentials: 'include',
                            headers: {
                                'Content-type': 'application/json'
                            },
                            body: JSON.stringify(user)
                        })
                        .then(async res => {
                            const data = await res.json();

                            if(!res.ok){
                                printResultMsg(data.msg);
                            } else {
                                if(data.login){
                                    printResultMsg('')
                                    this.user.setLoggedState(data)
                                } else {
                                    printResultMsg(data.msg, true);
                                }
                            }

                            this.signBtn.classList.remove('inactive-btn');
                        }).catch(err => {
                            printResultMsg(err);
                            this.signBtn.classList.remove('inactive-btn');
                        });
                    }, this.signForm)

                    this.userBtn.appendChild(this.signWindow)
                })();

                let onWindow = 'signWindow';
                let offWindow = 'userWindow';
                
                const cp = bot.cp;
                this.user = {
                    login: null,
                    permissions: 'standard',
                    updatingTemplate: {},

                    get isUpdatingTemplate(){
                        return Boolean(this.updatingTemplate && this.updatingTemplate.name)
                    },

                    get isLoggedIn(){
                        return Boolean(this.login)
                    },

                    switchPrivate(){
                        return cp.privateSwitch.classList.toggle('true')
                    },

                    setUpdating(temp){
                        if(temp && temp.name){
                            this.updatingTemplate = temp;
                            cp.tempUpdatingName.value = temp.name;
                            
                            if(temp.private){
                                cp.privateSwitch.classList.add('true')
                            } else {
                                cp.privateSwitch.classList.remove('true')
                            }

                            cp.panel.classList.add('editMode')
                            
                        } else {
                            this.updatingTemplate = null;
                            if(cp.tempUpdatingName) cp.tempUpdatingName.textContent = '-';
                            cp.panel.classList.remove('editMode')
                        }
                    },

                    setLoggedState(user){
                        if(user && user.login){
                            this.login = user.login;
                            this.permissions = user.permissions;
                            this.autoSave = user.autoSave;
                            this.setUpdating(user.updatingTemplate);
                            
                            if(this.autoSave){
                                const autoSave = this.autoSave;
                                // const asTemp = autoSave.template;
                                // const defTemp = bot.text.packData();
                                
                                setTimeout(() => {
                                    bot.cp.showAlert('Do you want to load autosave from '+autoSave.timestamp+'? You can access your autosave later in search window.', {
                                        okBtnText: 'Load autosave',
                                        onConfirm(){
                                            bot.text.import(null, autoSave.template, true)
                                        }
                                    })
                                }, 0)
                            }
                            
                            if(user.updatingTemplate) cp.updateTemplate('init')
                        } else {
                            this.login = null;
                            this.permissions = null;
                            this.autoSave = null;
                            this.setUpdating(null);
                        }
                        logInOutAction()
                    }
                }
                
                const logInOutAction = () => {
                    this.myTemplates.classList.toggle('bot-unshown')
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
                    loginContainer.textContent = this.user.login;
                }

                const authCheck = () => {
                    fetch(backendUrl + 'users/authorize', {
                        method: 'POST',
                        credentials: 'include'
                    }).then(async res => {
                        const user = await res.json()
                        
                        if(user && user.login){
                            this.user.setLoggedState(user)
                        }
                    })
                    .catch(err => {
                        console.log(err);
                    })
                };

                authCheck();

                // account/user window
                (() => {
                    const resultMsgBox = makeEl('result-msg')
                    const printResultMsg = printResultMessage.bind(null, resultMsgBox)

                    createBtn('closeUser', 'X', ['bot--btn'], e => {
                        this.userWindow.classList.add('off')
                    })
                    createParentDivAndAppend('loginTitle', [])
                    const topBar = makeEl('top-bar', [this.loginTitle, this.closeUser]);

                    createBtn('userTemplates',
                        {text: 'My templates', iconPath: 'M16 0v2h-8v-2h8zm0 24v-2h-8v2h8zm2-22h4v4h2v-6h-6v2zm-18 14h2v-8h-2v8zm2-10v-4h4v-2h-6v6h2zm22 2h-2v8h2v-8zm-2 10v4h-4v2h6v-6h-2zm-16 4h-4v-4h-2v6h6v-2z'},
                        ['bot-list-item'],
                        e => {
                            handleWindowActions(e, this.searchWindow, ['.template-menu']);
                            this.editSearchParams({ myTemplates: 1 })
                            this.fetchTemplates()
                        }
                    )
                    
                    createBtn('logoutBtn', 
                        {text: 'Logout', iconPath: 'M16 9v-4l8 7-8 7v-4h-8v-6h8zm-16-7v20h14v-2h-12v-16h12v-2h-14z'},
                        ['bot-list-item', 'sign-btn', 'icon-btn'],
                        e => {
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
                        }
                    )
                    
                    const windowContent = makeEl('user-content', [this.userTemplates, this.logoutBtn])

                    createParentDiv('userWindow', [topBar, windowContent])
                    this.userWindow.classList.add('sign-window', 'bot-window', 'off')
                    this.userWindow.title = ''
                    
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

                this.manageWindowPos = (window) => {
                    setTimeout(() => {
                        const y = window.getBoundingClientRect().y
                        if(y<0){
                            window.style.setProperty('bottom', y+'px')
                        } else {
                            window.style.removeProperty('bottom')
                        }
                    }, 10)
                } 

                let nonSimultaneousWindows = [/*this.signWindow, */this.uploadWindow, this.searchWindow];
                const handleWindowActions = (e, window, clickBlacklist, actions = null) => {
                    // check blacklist and if event was emitted by a click
                    if(e.screenX && checkClickBlacklist(e, clickBlacklist)){
                        const isWindowOn = !window.classList.toggle('off')
                        const nonSim = nonSimultaneousWindows;

                        if(actions) actions()
                        // close any windows that are in 'nonSimultaneousWindows' array
                        for(let i=0; i<nonSim.length; i++){
                            if(nonSim[i] !== window && !nonSim[i].classList.contains('off')) nonSim[i].classList.add('off')
                        }
                        // if section in which window is contained is hidden, then show it
                        const parentSection = window.closest('section')
                        if(parentSection) parentSection.classList.remove('off')
                        
                        if(window !== this[onWindow]) this[onWindow].classList.add('off')
                        this.manageWindowPos(window)
                        
                        return isWindowOn
                    } else return false
                }

                this.temporarySave = null;
                this.makeTemporarySave = () => {
                    this.temporarySave = bot.text.packData()
                }

                this.applyTemporarySave = () => {
                    bot.text.import(null, this.temporarySave, true)
                }

                this.postAutoSave = () => {
                    fetch(backendUrl+'templates/autoSave', {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-type': 'application/json'
                        },
                        body: JSON.stringify({
                            name: '__autosave__',
                            template: bot.text.packData(),
                            autoSave: true
                        })
                    }).catch(err => {
                        console.log(err);
                    })
                }

                window.addEventListener('beforeunload', e => {
                    const user = this.user;
                    if(user.isLoggedIn){
                        if(!user.isUpdatingTemplate){
                            try {
                                const blob = new Blob([JSON.stringify({
                                    name: '__autosave__',
                                    template: bot.text.packData(),
                                    autoSave: true
                                })], {type: 'application/json; charset=UTF-8'});
    
                                navigator.sendBeacon(backendUrl+'templates/autoSave', blob)
                            } catch (err) {
                                console.log(err);
                            }
                        }
                    } else console.log('Cant post autosave, user doesnt appear to be logged in')
                })

                const title = makeEl('bot-title', 'BloonBot v' + bot.version, 'a')
                title.href = 'https://bit.ly/bloonbot'
                title.target = 'blank'
                const byDWS = makeEl('bot-by', 'by Dallow Wish Studios', 'a')
                byDWS.href = 'https://www.facebook.com/PaprykarzPotworowski'
                byDWS.target = 'blank'
                const credits = makeEl('bot-credits', [title, byDWS])
                this.panel.appendChild(credits);

                const loginContainer = makeEl('login-container')
                const userContainer = makeEl('user-container', [this.userBtn, loginContainer])
                const mainBtnsContainer = makeEl(['bot--container'], [this.hideBtn, this.sideSwitch, userContainer])

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
                // const css = ''
                const css = `#botPanel{color:#fff;padding:10px;z-index:1000;position:absolute;width:450px;box-sizing:border-box;font-family:roboto,arial}#botPanel,.bot-window{background:#000d}#botPanel.right{right:0}#botPanel.right .bot-window{right:30px;left:initial}.editMode{border:1px solid #c33}.update-toolbar{display:none;justify-content:space-between;padding-top:10px;margin-top:10px;border-top:1px solid #c33}.editMode .update-toolbar{display:flex}.temp-update-label{color:#aaa;font-size:.8em}.temp-update-name{font-weight:700;width:100%;background:0 0;border:none;border-bottom:1px solid #555;color:#fff;font-size:.9rem}.temp-update-name:focus{border-bottom:1px solid #fff}.temp-updating-editables{margin-top:3px;display:flex}.update-toolbar .private-switch{cursor:pointer;fill:#666}.update-toolbar .private-switch.true{fill:#fff}#botPanel input,#botPanel textarea{box-sizing:border-box}#botPanel label,#botPanel label *{cursor:pointer}.top-btns{margin-left:10px;fill:#fff}.side-switch{padding:2px!important}.sign-window{top:0;bottom:initial!important}.sign-window .bot--btn{margin-top:10px}.bot-flick{display:flex;justify-content:center;align-items:flex-end;padding:5px 8px;color:#aaa;cursor:pointer}.bot-flick.active{border-bottom:2px solid #ff5151;color:#fff}.bot-flick:nth-of-type(2){margin-left:10px}.user-content{display:flex;flex-flow:column;justify-content:center;margin-top:8px}.user-container{display:flex;align-items:center}.login-container{margin-left:10px;padding:5px}.bot-svg-icon{margin-right:5px;width:1.3em;fill:#fff}.bot-list-item .bot-svg-icon{margin-right:10px;width:20px;fill:#aaa}.update-toolbar .bot--btn .bot-svg-icon{width:15px;fill:#fff;margin-right:5px}.update-toolbar .bot--btn{display:flex;align-items:center}.bot-list-item{display:flex;justify-content:left!important;align-items:center;padding:6px;background:0 0;text-align:left;color:#fff;border:none;border-top:1px solid #333;font-size:14px;cursor:pointer;width:initial!important}.bot-list-item:hover{background:#4449}.inactive-btn{background:#666!important;pointer-events:none}.inactive-btn::after{content:'...'}.bot--btn.disabled-btn{background:0 0!important}.input-container{display:flex;align-items:center;justify-content:center}.sign-window .input-container{margin-top:5px}.input-container input{flex:1;margin-left:5px}.result-msg{color:#6f6;margin-top:5px}.result-msg.wrong{color:#f66}.form-input-label{margin-top:0!important}.bot-credits{color:#555;right:10px;position:absolute;font-size:15px;display:flex;flex-flow:column;align-items:flex-end}.bot-by{font-size:11px;color:#555}#bot--all-without-hide-btn{display:flex;flex-flow:column;justify-content:center;margin:10px 0 0}.bot--list{max-height:20vh;overflow:auto}.bot--container{display:flex;justify-content:space-between;align-items:center}.bot--queue-item{padding:2px;background:#fff9;color:#000;border-top:1px solid #777;max-width:100%;overflow:hidden;position:relative;text-overflow:ellipsis;white-space:nowrap}.bot--queue-item.bot--cond-item{padding:0}.bot--list-active-el{background:#fffc}.bot--list-active-el::after{content:'';position:absolute;right:0;top:0;height:100%;width:25px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' fill='%23f55' viewBox='0 0 640 640' shape-rendering='geometricPrecision' text-rendering='geometricPrecision' image-rendering='optimizeQuality' fill-rule='evenodd' clip-rule='evenodd'%3E%3Cpath d='M153.581 320L486.42 640.012V-.012L153.581 320z'/%3E%3C/svg%3E");background-position:left}.bot--queue-item{font-size:15px}#bot--rate{margin:10px 0 0;color:#fff}#bot--rate-controller{cursor:pointer;width:100%}#bot--rate-gauge{font-weight:700}.onOffSwitches{display:flex;margin-bottom:10px}.onOffSwitches>*{flex:1 0 40px}.bot-options{display:flex;flex-flow:column}.section-container{display:grid;grid-template-columns:100%}.section-container.with-border{border-top:2px solid #333;padding-top:10px;margin:10px 0 7px}.section-content{display:flex;flex-flow:column;position:relative}.hide-section-btn{border:none;padding:0 5px;margin:-20px 0 10px;justify-self:center;background:#000;color:#555;font-size:.8rem;display:flex;align-items:center;cursor:pointer}.hide-section-btn svg{width:12px;fill:#555;transform:rotateZ(90deg)}.hide-section-btn:hover{color:#bbb!important}.hide-section-btn:hover>svg{fill:#bbb!important}.section-container.off>.section-content{display:none}.section-container.off>.hide-section-btn{color:#888}.section-container.off>.hide-section-btn>svg{transform:rotateZ(0);fill:#888}.bot--btn{padding:5px;background:#da1a1a;color:#fff;border:2px solid #fff;cursor:pointer;font-weight:700}.bot--switch{padding:10px;flex:3 0 200px}.bot--remove-queue{padding:2px 6px}.bot--list-control{display:flex;justify-content:space-between;align-items:center;margin:5px 0 5px}.server-btn{margin-bottom:15px!important}.bot--expimp .bot-window{left:210px}.bot--expimp{display:flex}.bot--expimp .icon-btn{width:100%}.bot--expimp .bot-svg-icon{height:130%;margin-right:0;fill:inherit}.bot--export-div>*,.import-top>*{margin-bottom:5px}.bot--expimp input{width:100%}.bot--expimp .upload-window input{width:initial}.bot--expimp .bot-window{color:#fff}.bot--import-div .bot--btn{background:#8f8;color:#080}#bot--impSep{width:30px}#bot--expName{width:130px}.bot--export-div,.bot--import-div{position:relative;width:50%}.bot--export-div .bot--btn{background:#f88;color:#800}.bot--export-div{margin-right:10px}.upload-btn{fill:#800}.upload-content{margin-top:10px}.upload-content .input-container{margin-bottom:10px}.upload-temp{grid-column:2/4;grid-row:end;margin-top:10px}.upload-window .private-div{display:flex;align-items:center;justify-content:center}.search-btn{fill:#080}.search-window{height:500px}.icon-btn{width:30px;height:30px;position:relative;display:flex;justify-content:center;align-items:center}.icon-btn>svg{width:30px}.bot-window{position:absolute;left:40px;bottom:30px;width:400px;cursor:auto;padding:10px;font-weight:400;z-index:11}.bot-window .top-bar{display:flex;justify-content:space-between;align-items:center;font-size:1.2em;font-weight:700;margin-bottom:10px}.bot-unshown,.bot-window.off{display:none;pointer-events:none}.bot-window .close{margin-left:10px;color:#fff;background:red}.search-window{display:flex;flex-flow:column}.templates-result{overflow:auto}.template{background:#222;padding:5px;position:relative;margin-top:8px}.template-name{font-weight:700}.template-author{color:#888}.template-peek{color:#bbb;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;margin:5px 0}.template .result-msg{margin-top:0}.template.private .template-name svg{width:12px;margin-left:6px;fill:#fff}.template.private{background:#121212}.bot-temp-apply,.bot-temp-menu{fill:#aaa;position:absolute;cursor:pointer}.bot-temp-apply{margin:0 5px;right:0;top:5px}.bot-temp-menu{left:0}.template-menu{width:100px;left:0;top:10px;position:absolute;background:#000a;z-index:1}.template-option{margin:0!important;padding:5px 0;border-bottom:1px solid #555}textarea{width:100%;resize:none}select{cursor:pointer}.bot--box-l2{margin-left:20px}.bot--box-l3{margin-left:30px}#botPanel label.unactive{color:#aaa}.bot-condits-switch{position:absolute;right:0}#botPanel .btn-on{background:green}.unactive-form{display:none}.cond-form{margin-top:30px}.cond-form .input-container{display:flex;flex-flow:column;align-items:flex-start;width:45%}.cond-control{font-weight:700}.cond-form input{width:100%;margin-left:0!important}.bot--cond-item{display:flex}.bot--cond-item>*{width:50%;height:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:2px}.then-part{background:#f779}.necessary_submit{display:none}.templates-modes-div{margin-top:10px;display:flex;justify-content:space-between}.queue-icon{margin-right:6px;cursor:pointer}.editInput{width:100%;box-sizing:border-box}.invalid-item{color:#fff;background:#f22}.begin-div{margin-top:10px}.bot-warning{background:rgba(236,178,18,.356);padding:8px;font-size:.8rem;margin-bottom:8px;display:flex;justify-content:space-between}.bot-warning.closed{display:none}.bot-close-warning{font-weight:700;cursor:pointer}.warning-screen{position:absolute;z-index:10;background:rgba(0,0,0,.842);display:flex;flex-flow:column;width:100%;height:100%;justify-content:center;align-items:center;top:0;left:0}.warning-btns{display:flex;flex-flow:row;margin-top:20px}.warning-btns .bot--btn{flex:1;text-align:center;width:120px}.warning-ok{margin:0 10px}.warning-cancel{background:0 0;margin:0 10px}.warning-info{text-align:center;padding:0 30px}`;
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
            onlyFirstMatchingCond: true,

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
                            } finally {
                                if(this.onlyFirstMatchingCond)
                                    break
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
                if (this.listLength !== 0) {
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

            confirmListRemove(cb){
                if(this[this.presentListLength] === 0 || !cb) return

                bot.cp.showAlert('This will clear list of messages. Proceed?', {
                    okBtnText: 'Clear list',
                    onConfirm(){
                        cb()
                    }
                })
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
                if(newArr.length && typeof newArr[0] === 'string')
                    newArr = newArr.filter(msg => msg !== '')

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
                this.confirmListRemove(() => {
                    this.mutateTextArr([])
                });
            },

            updateListItem(id){
                let itemElement
                if(!this.isConditsShown)
                    itemElement = this.list.children[id];
                else
                    itemElement = this.condList.children[id];

                if(itemElement){
                    itemElement.innerHTML = '';
                    const el = this.createListItem(this[this.presentArr][id]);
                    itemElement.appendChild(el);
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

            import(sep, input, isJSON = false, queueOnly = false) {
                const isPlainText = (typeof input === 'string');

                const splitText = (text) => {
                    if (sep === '\\n')
                        sep = '\n';

                    const arr = text.split(sep);
                    this.mutateTextArr(arr, queueOnly ? 'queue' : false);
                }

                if (!isPlainText) {
                    
                    const processData = (data) => {
                        if(!data || !data.textArr || !data.condArr){
                            bot.cp.showAlert('Unable to apply template. Not enough template data.', {okOnly: true})
                            return
                        }

                        this.mutateTextArr(data.textArr, 'queue');
                        this.mutateTextArr(data.condArr, 'conds');
                                
                        const keys = Object.keys(data.settings.boxes);
                        const vals = Object.values(data.settings.boxes);
                        const cp = bot.cp;
                            
                        for(let i=0; i<keys.length; i++){
                            const rawBoxName = keys[i];
                            const isTrue = vals[i];
                            
                            if(this[rawBoxName] !== isTrue){
                                const boxNameRemovedIs = rawBoxName.slice(2,3).toLowerCase() + rawBoxName.slice(3); // keys transformed to match checkboxes names on 'this' object
                                const boxName = boxNameRemovedIs+'Box';
                                const boxEl = cp[boxName];
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
                        bot.cp.showAlert('Please upload a file or enter some text before continuing.', {okOnly: true})
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

            const necessaries = {
                'send button': this.btn,
                'input': this.inp,
                'chat area': this.log
            };
            
            if(!this.devMode){
                for (const key in necessaries) {
                    if (necessaries.hasOwnProperty(key)) {
                        const element = necessaries[key];
                        
                        if(!element) this.cp.showAlert('Missing necessary element: ' + key + '. Bot may not work properly.', {okOnly: true})
                    }
                }
            }
        },
    }

    window.bot = bot;
}
//6obcy
bot.init('#box-interface-input', 'button.o-any.o-send', 'button.o-any.o-esc', '#log-dynamic', 'log-stranger');

//e-chat.co
// bot.init('#InputTextArea', '#SendButton', 'null');
