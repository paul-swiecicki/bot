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

    var bot = {

        version: '2.0',
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
                        onEnd: e => {
                            const kids = this.list.children;
                            const newTextArr = [];
        
                            for (let i = 0; i < kids.length; i++) {
                                newTextArr.push(kids[i].textContent);
                            }
        
                            bot.text.mutateTextArr(newTextArr);
                        }
                    });

                    Sortable.create(this.condList, {
                        group: 'botConds',
                        animation: 100,
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

                const createParentDivAndAppend = (el, childEl, parentEl = 'all', elType = 'div') => { //childEl must be an array
                    this[el] = document.createElement(elType);

                    for (let i = 0; i < childEl.length; i++) {
                        this[el].appendChild(this[childEl[i]]);
                    }
                    this[parentEl].appendChild(this[el]);
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
                    this[parentEl].appendChild(this[btn]);
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

                createCheckbox('loopDiv', 'loopBox', 'setLoop', 'Loop ', true);
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
                // ################################################################################################
                createBtn('conditsSwitch', 'conditionals >', ['bot--condits-switch', 'bot--btn'], this.handleConditsSwitch.bind(this));

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

                this.sub = document.createElement('input');
                this.sub.type = 'submit';
                this.sub.classList.add('necessary_submit');

                createParentDivAndAppend('condControl', ['condIfDiv', 'condThenDiv', 'removeCondsBtn', 'sub']);
                this.condControl.classList.add('bot--list-control');

                this.condList = document.createElement('div');
                this.condList.classList.add('bot--list');
                this.condList.addEventListener('click', e => {
                    bot.text.removeMessage(e.target.closest('.bot--queue-item').dataset.id);
                    // console.log(e.target.closest('.bot--queue-item').dataset.id);
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

                createBtn('removeQueueBtn', 'X', ['bot--btn'], e => {
                    bot.text.removeQueue();
                });
                this.removeQueueBtn.id = 'bot--remove-queue';

                this.upperDiv = document.createElement('div');
                this.upperDiv.classList.add('bot--list-control');
                this.upperDiv.appendChild(this.addToList);
                this.upperDiv.appendChild(this.resetQueueBtn);
                this.upperDiv.appendChild(this.removeQueueBtn);

                this.list = document.createElement('div');
                this.list.classList.add('bot--list');
                this.list.addEventListener('click', e => {
                    bot.text.removeMessage(e.target.dataset.id);
                });

                createSelect('modes', ['bot--modes'], 'selectMode', ['NONE', 'increment', 'parrot', 'parrot+'], 'Mode ', e => {
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

                createBtn('importBtn', '> Import <', ['bot--btn', 'bot--import'],
                    e => {
                        // imp();
                    }, 'importDiv');

                this.expName = document.createElement('input');
                this.expName.placeholder = 'file name';
                this.expName.id = 'bot--expName';

                this.impSeparation = document.createElement('input');
                this.impSeparation.placeholder = 'sep.';
                this.impSeparation.id = 'bot--impSep';

                this.importFile = document.createElement('input');
                this.importFile.type = 'file';

                this.exportDiv.classList.add('bot--export-div');
                this.exportDiv.appendChild(this.expName);
                this.importDiv.classList.add('bot--import-div');
                this.importDiv.appendChild(this.impSeparation);
                this.importDiv.appendChild(this.importFile);

                this.importInput = document.createElement('textarea');
                this.importInput.placeholder = 'Paste or type in some text to import';
                this.importDiv.appendChild(this.importInput);

                this.expImp.appendChild(this.exportDiv);
                this.expImp.appendChild(this.importDiv);
                this.all.appendChild(this.expImp);

                this.panel.appendChild(this.hideBtn);
                createBtn('sideSwitch', '<|>', ['sideSwitch', 'bot--btn'], e => {
                    this.panel.style.setProperty('right', this.position === 'right' ? 'initial' : 0);

                    this.position = (this.position === 'right' ? 'left' : 'right');
                }, 'panel')
                appendElWithText('title', ['bot--title'], 'Bl🎈🎈nBot v' + bot.version, 'panel');
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
                        background: #0008;
                        box-sizing: border-box;
                    }

                    .sideSwitch {
                        margin-left: 10px;
                    }

                    #botPanel label *, #botPanel label {
                        cursor: pointer;
                    }

                    .bot--title {
                        display: inline-block;
                        position: absolute;
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
                        margin-top: 10px;
                    }

                    .bot--queue-item {
                        padding: 2px;
                        background: #fff9;
                        color: black;
                        border-top: 1px solid #777;
                        max-width: 100%;
                        overflow: hidden;
                        cursor: pointer;
                        position: relative;
                        text-overflow: ellipsis;
                        white-space: nowrap;
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
                        margin: 10px 0 5px;
                    }

                    .bot--expimp {
                        margin: 10px 0 5px;
                        display: flex;
                        justify-content: space-around;
                        flex-flow: column;
                    }

                    .bot--expimp input[type='file']{
                        width: 200px;
                        margin-left: 10px;
                    }

                    .bot--expimp input{
                        width: 100%;
                    }

                    .bot--expimp div {
                        margin-top: 10px;
                    }

                    .bot--import {
                        background: #8f8;
                        margin-top: 10px;
                        color: #080;
                    }

                    .bot--export {
                        background: #f88;
                        color: #800;
                    }

                    #bot--impSep {
                        width: 25px;
                        height: 15px;
                    }

                    #bot--expName {
                        width: 60px;
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
                    }

                    .then-part {
                        background: #f779;
                        padding: 0 3px;
                    }

                    .necessary_submit {
                        display: none;
                    }

                    .templates-modes-div {
                        margin-top: 10px;
                        display: flex;
                        justify-content: space-between;
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

            checkCond(){
                const strangerMsg = this.getStrangerMsg();
                if(strangerMsg){
                    const strMsg = strangerMsg.trim().toLowerCase();

                    for(let i=0; i<this.condListLength; i++){
                        const conds = this.condArr[i];
                        let ifCond = conds.ifs[0];
                        const thenCond = conds.thens[0];

                        if(/^\/[\s\S]*\//.test(ifCond)){ // check if ifconditional is a regex

                            const userReg = ifCond.replace(/^\/|\/$/g, '');
                            const reg = new RegExp(userReg);
                            
                            const m = strMsg.match(reg);
                            
                            if(m){
                                this.insertMsg(thenCond);
                                bot.sendMsg();
                            }
                        } else {
                            ifCond = ifCond.trim().toLowerCase()
                            if(strMsg === ifCond){
                                this.insertMsg(thenCond);
                                break;
                            }
                        }
                    }
                    bot.sendMsg();
                }
            },

            checkCounters(){
                for(const counterStr of this.counters){
                    this[counterStr] = (this[counterStr]+1 > this.listLength) ? 0 : this[counterStr];
                }
            },

            insert() {
                if (this.listLength === 0) {
                    bot.stop();
                    alert('Empty queue!');
                } else {
                    this.checkCounters()

                    if (this.isRandom && !this.afterRandomChecked) {
                        this.counter = Math.floor(Math.random() * this.listLength);
                    }

                    switch (this.mode) {
                        case 'parrot': {
                            this.insertMsg(this.getStrangerMsg());
                        }
                        break;

                        case 'parrot+': {
                            const msgRaw = this.textArr[this.counter];
                            const msgSplted = msgRaw.split('$msg', 2);

                            let msg = '';
                            if(msgSplted.length > 1){
                                msg = msgSplted[0] + this.getStrangerMsg() + (msgSplted[1] ? msgSplted[1] : '');
                            } else {
                                msg = msgSplted[0];
                            }
                            this.insertFromQueue(msg);
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
                            this.insertFromQueue(this.textArr[this.counter]);
                        }
                    }

                    if (this.isRandom)
                        this.afterRandomChecked = false;
                
                    this.setActiveListEl();
                }
            },

            setActiveListEl(){
                this.list.children[this.counter].classList.add('bot--list-active-el');

                if (this.oldCounter !== this.counter)
                    this.list.children[this.oldCounter].classList.remove('bot--list-active-el');
                this.oldCounter = this.counter;
            },

            insertFromQueue(msg){
                this.insertMsg(msg);
                if (!this.isRandom) this.counter++;
                
                if (this.counter+1 > this.listLength) {
                    if (!this.isRandom) this.counter = 0;
                    if (!this.isLoop) bot.stop();
                }
            },

            insertMsg(msg) {
                this.input.value = msg;
            },

            getStrangerMsg() {
                if(bot.isLastMsgStrangers()){
                    const strangerMsg = bot.log.lastChild.textContent;
                    return strangerMsg.replace(/Obcy:\s/, '');
                } else
                    return null
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

                this.updateList();
            },

            realTypeSetup() {
                if (this.isRealType) {
                    const len = this.textArr[this.counter].length;

                    bot.changeRate(this.initialRate / 10 * len + this.itemPause, true);
                }
            },

            setTemplate(temp) {
                if(confirm('This will clear the list of messages. Proceed?')){
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

            setMode(mode) {
                if (mode === 'parrot' || mode === 'parrot+') {
                    this.mode = (mode === 'parrot') ? mode : 'parrot+';
                    const reply = bot.cp.replyBox;
                    if (!reply.checked)
                        reply.click();
                } else if (mode !== 'NONE')
                    this.mode = mode;
                else
                    this.mode = null;

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
                if(confirm('This will clear list of messages. Proceed?'))
                    this.mutateTextArr(!this.isConditsShown ? ['🎈'] : this.initCondArr);
            },

            updateList(forceMode = false) {
                if(forceMode ? forceMode === 'queue' : !this.isConditsShown){
                    this.list.innerHTML = '';
                    const frag = document.createDocumentFragment();

                    this.textArr.map((item, id) => {
                        if (item && item !== ' ' && item !== '\n') {
                            const msg = document.createTextNode(item);
                            const msgNode = document.createElement('div');
                            msgNode.dataset.id = id;
                            msgNode.appendChild(msg);
                            msgNode.classList.add('bot--queue-item');
                            frag.appendChild(msgNode);
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
                        const container = document.createElement('div');
                        const ifPart = document.createElement('div');
                        const thenPart = document.createElement('div');

                        container.dataset.id = id;
                        container.classList.add('bot--queue-item', 'bot--cond-item');
                        ifPart.classList.add('if-part');
                        thenPart.classList.add('then-part');

                        ifPart.appendChild(document.createTextNode(item.ifs[0])); //undefined ifs
                        thenPart.appendChild(document.createTextNode(item.thens[0]));

                        container.appendChild(ifPart);
                        container.appendChild(thenPart);
                        
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

            export(fileName) {
                const data = {
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
                        mode: this.mode
                    },
                      
                    textArr: this.textArr,
                    condArr: this.condArr
                }

                download(JSON.stringify(data), (fileName ? fileName : this.textArr[0]) + '.json', 'text/plain');
            },

            import(sep, input) {
                const isPlainText = (typeof input === 'string');

                const splitText = (text) => {
                    if (sep === '\\n')
                        sep = '\n';

                    const arr = text.split(sep);
                    this.mutateTextArr(arr);
                }

                if (!isPlainText) {
                    const processFile = (e) => {
                        const text = e.target.result;
                        const data = JSON.parse(text);

                        // const initConditsState = !this.isConditsShown;
                        // this.toggleCondits(true);
                        this.mutateTextArr(data.textArr, 'queue');
                        // this.toggleCondits(false);
                        this.mutateTextArr(data.condArr, 'conds');
                        // this.toggleCondits(initConditsState);
                        
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

                        bot.changeRate(data.settings.rate, false, true);
                        this.setMode(data.settings.mode);

                        const switches = data.settings.switches;
                        bot.onOffSpecific('queue', switches.queue);
                        bot.onOffSpecific('conds', switches.conds);
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

                this.updateList();
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
            
            this.botInterval = setInterval(() => {
                this.runSetup();
            }, this.rate);

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
                this.text.reset();
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
