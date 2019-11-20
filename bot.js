bot ? bot.stop() : null;
var bot = {
 
    version: '1.4.1',
    botInterval: 0,
    fakeTypeInterval: 0,
    rate: 500,
    isRunning: false,
    isAutoNext: false,
    isFirstRun: true,

    cp: {
        btn: '',
        btnAutoNext: '',
        panel: '',
        rateController: '',
        rateText: '',
        listForm: '',
        addToList: '',
        isHidden: false,

        init(){
            const body = document.querySelector('body');

            const oldBotPanel = document.querySelector('#botPanel');
            oldBotPanel ? (oldBotPanel.remove()) : null;

            const oldSortablejs = document.querySelector('#sortablejs');
            oldSortablejs ? (oldSortablejs.remove()) : null;

            const sortablejs = document.createElement('script');
            sortablejs.id = 'sortablejs';
            sortablejs.src = 'https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js';
            body.appendChild(sortablejs);

            sortablejs.addEventListener('load',() => {
                Sortable.create(this.list, {
                    group: 'botQueue',
                    animation: 100
                });
            })

            this.all = document.createElement('div');
            this.all.id = 'bot--all-without-hide-btn'

            const addIdAndClasses = (el, id = null, classes = null) => {
                if(id)
                    el.id = controllerId;
                
                if(classes)
                    el.classList.add(...classes);
            }

            const createParentDivAndAppend = (el, childEl, parentEl = 'all', elType = 'div') => { //childEl must be an array
                this[el] = document.createElement(elType);

                for(let i=0; i<childEl.length; i++){
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
                    if(fn) fn(chked)
                });

                createParentDivAndAppend(parentEl, [el], 'all', 'label');
                this[parentEl].appendChild(document.createTextNode(label));
            }
            
            const createBtn = (btn, text, classes, clickFn, parentEl = 'all') => {
                this[btn] = document.createElement('button');
                addIdAndClasses(this[btn], null, classes);
                this[btn].appendChild(document.createTextNode(text))
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
                if(this.isHidden){
                    this.hideBtn.style.setProperty('background','red');
                    this.all.style.setProperty('display', 'flex');
                } else {
                    this.hideBtn.style.setProperty('background','green')
                    this.all.style.setProperty('display', 'none');
                }
                this.isHidden = !this.isHidden;
            });

            this.panel = document.createElement('div');
            this.panel.id = 'botPanel';

            createBtn('btn', 'ON/OFF', ['bot--btn', 'bot--switch'],
            e => {
                bot.toggle();
            });

            this.all.appendChild(this.btn);

            createCheckbox('loopDiv','loopBox','setLoop','Loop ',true);
            createCheckbox('replyDiv','replyBox','setReply','Reply Mode ', false, false, (chked) => {
                this.replyAllDiv.classList.toggle('unactive');
            });
            createCheckbox('replyAllDiv','replyAllBox','setReplyAll','Send whole queue', false, true);
            addIdAndClasses(this.replyAllDiv, null, ['bot--box-l2', 'unactive']);
            createCheckbox('randomDiv','randomBox','setRandom','Random');
            createCheckbox('realTypeDiv','realTypeBox','setRealType','Real Type™');
            createCheckbox('fakeTypeDiv','fakeTypeBox','setFakeType','Fake Typing');

            createRange('rate', 'bot--rate', 'rateText', 'Send once/<span id="bot--rate-gauge">'+bot.rate+'ms</span>', 'rateController', 'bot--rate-controller', 0, 10000, bot.rate, 1, 
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
            createBtn('conditsSwitch', 'conditionals', ['bot--condits-switch', 'bot--btn'], e => {
                bot.text.toggleCondits();
            });

            this.templates = document.createElement('div');
            this.templates.classList.add('bot--templates');
            this.select = document.createElement('select');

            const optionsArr = ['NONE','increment', 'waves', 'parrot', 'parrot+ ( | )', 'Bałkanica'];
            for(let i=0; i<optionsArr.length; i++){
                const opt = document.createElement('option');

                opt.appendChild(document.createTextNode(optionsArr[i]));
                opt.value = optionsArr[i];
                this.select.appendChild(opt);
            }
            this.templates.appendChild(document.createTextNode('Template '));
            this.templates.appendChild(this.select);
            
            this.select.addEventListener('change', e => {
                bot.text.setTemplate(e.target.value);
            });
            // appendElWithText('templatesLabel', ['bot--temp-label'], 'Template ', 'templates');
            createParentDivAndAppend('containerTempCond', ['templates', 'conditsSwitch']);
            addIdAndClasses(this.containerTempCond, null, ['bot--container']);
            
            // this.all.appendChild(this.templates);

            this.addToList = document.createElement('input');
            this.addToList.placeholder = 'Add to message queue';
            this.addToList.setAttribute('style','width: 80%');

            createBtn('resetQueueBtn', 'R', ['bot--btn'], e => {
                bot.text.reset();
            });

            createBtn('removeQueueBtn', 'X', ['bot--btn'], e => {
                bot.text.removeQueue();
            });
            this.removeQueueBtn.id = 'bot--remove-queue';

            this.upperDiv = document.createElement('div');
            this.upperDiv.id = 'bot--list-control';
            this.upperDiv.appendChild(this.addToList);
            this.upperDiv.appendChild(this.resetQueueBtn);
            this.upperDiv.appendChild(this.removeQueueBtn);

            this.list = document.createElement('div');
            this.list.id = 'bot--list';
            this.list.addEventListener('click', e => {
                bot.text.removeMessage(e.target.dataset.id);
            });
            this.list.addEventListener('drop', e => {
                const kids = this.list.children;
                const newTextArr = [];
                
                for(let i=0; i<kids.length; i++){
                    newTextArr.push(kids[i].textContent);
                }

                bot.text.mutateTextArr(newTextArr);
            });

            createParentDivAndAppend('listForm', ['upperDiv','list'], 'all', 'form')
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
                const sep = this.expSeparation.value;
                bot.text.export(sep);
            }, 'exportDiv');

            createBtn('importBtn', '> Import <', ['bot--btn', 'bot--import'],
            e => {
                imp();
            }, 'importDiv');

            this.expSeparation = document.createElement('input');
            this.expSeparation.placeholder = 'sep.';
            this.expSeparation.id = 'bot--expSep';

            this.impSeparation = document.createElement('input');
            this.impSeparation.placeholder = 'sep.';
            this.impSeparation.id = 'bot--impSep';

            this.importFile = document.createElement('input');
            this.importFile.type = 'file';

            this.exportDiv.classList.add('bot--export-div');
            this.exportDiv.appendChild(this.expSeparation);
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
            appendElWithText('title', ['bot--title'], 'BloonBot v'+bot.version, 'panel');
            this.panel.appendChild(this.all);
            
            body.insertBefore(this.panel, body.firstChild);

            this.stylize();
        },

        stylize(){
            const css = `
                #botPanel {
                    color: white;
                    padding: 10px;
                    z-index: 1000;
                    position: absolute;
                    width: 350px;
                    background: #0008;
                    box-sizing: border-box;
                }

                #botPanel label *, #botPanel label {
                    cursor: pointer;
                }

                .bot--title {
                    display: inline-block;
                    position: absolute;
                    right: 10px;
                    color: #888;
                    font-weight: bold;
                }

                #bot--all-without-hide-btn {
                    display: flex;
                    flex-flow: column;
                    justify-content: center;
                    margin: 10px 0 0;
                }

                #bot--list {
                    max-height: 300px;
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
                    border: 1px solid #f55;
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

                .bot--btn {
                    padding: 5px;
                    background: red;
                    color: white;
                    border: 2px solid white;
                    cursor: pointer;
                }

                .bot--switch {
                    padding: 10px;
                }

                .bot--remove-queue {
                    padding: 2px 6px;
                }

                #bot--list-control {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 10px 0 5px;
                }

                .bot--templates {
                    margin: 10px 0 0 0;
                }

                .bot--expimp {
                    margin: 10px 0 5px;
                    display: flex;
                    justify-content: space-around;
                    flex-flow: column;
                }

                .bot--expimp input[type='file']{
                    width: 170px;
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
                    color: black;
                    margin-top: 10px;
                }

                .bot--export {
                    background: #f88;
                    color: black;
                }

                #bot--impSep, #bot--expSep {
                    width: 25px;
                    height: 15px;
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
                    width: 30%;
                }
            `;

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
        input: '',
        counter: 1,
        oldCounter: 1,
        msgCounter: 1,
        loop: true,
        isReplyMode: false,
        isReplyAll: false,
        isRandom: false,
        isRealType: false,
        isFakeType: false,
        fakeTypeRate: 300,
        initialRate: 500,
        itemPause: 800,
        template: null,
        msg: '',
        isConditsShown: false,

        insert(){
            const insertFromQueue = (msg) => {
                this.insertMsg(msg);
                if(!this.isRandom) this.counter++;

                if(this.counter > this.listLength){
                    if(!this.isRandom) this.counter = 1;
                    if(!this.loop) bot.stop();
                }
            }

            if(this.listLength === 0){
                bot.stop();
                alert('Empty queue!');

            } else {
                if(this.isRandom && !this.afterRandomChecked){
                    this.counter = Math.floor(Math.random()*this.listLength)+1;
                }

                switch(this.template){
                    case 'parrot': {
                        this.insertMsg(this.getStrangerMsg());
                    } break;

                    case 'parrot+': {
                        const msgRaw = this.textArr[this.counter-1];
                        const msgSplted = msgRaw.split('|', 2);
                        const msg = msgSplted[0] + this.getStrangerMsg() + (msgSplted[1] ? msgSplted[1] : '');
                        
                        insertFromQueue(msg);
                    } break; 

                    case 'increment': {
                        this.initialMsg = this.textArr[0];
                        this.msg += this.initialMsg;
                        this.insertMsg(this.msg);
                        this.msgCounter++;
                    } break;

                    default: {
                        insertFromQueue(this.textArr[this.counter-1]);
                    }
                }

                if(this.isRandom)
                    this.afterRandomChecked = false;

                this.list.children[this.counter-1].classList.add('bot--list-active-el');

                if(this.oldCounter !== this.counter) 
                    this.list.children[this.oldCounter-1].classList.remove('bot--list-active-el');
                this.oldCounter = this.counter;
            }
        },

        insertMsg(msg){
            this.input.value = msg;
        },

        getStrangerMsg(){
            const strangerMsg = bot.log.lastChild.textContent;
            return strangerMsg.replace(/Obcy:\s/, '');
        },

        setLoop(state){
            this.loop = state;
        },

        setReply(state){
            this.isReplyMode = state;
        },

        setReplyAll(state){
            this.isReplyAll = state;
        },

        setRandom(state){
            this.isRandom = state;

            if(state){
                this.list.children[this.counter-1].classList.remove('bot--list-active-el');
                this.counter = Math.floor(Math.random()*this.listLength)+1;
                this.list.children[this.counter-1].classList.add('bot--list-active-el');
                this.afterRandomChecked = true;
            }
        },

        setRealType(state){
            this.isRealType = state;

            if(!state){
                bot.changeRate(this.initialRate);
            } else {
                bot.changeRate(1500);
            }
        },

        setFakeType(state){
            this.isFakeType = state;

            if(!state)
                clearInterval(bot.fakeTypeInterval);

            if(bot.isRunning) bot.start();
        },

        toggleCondits(){
            bot.cp.conditsSwitch.style.setProperty('background', this.isConditsShown ? 'red' : 'green');

            this.isConditsShown = !this.isConditsShown;
        },

        realTypeSetup(){
            if(this.isRealType){
                const len = this.textArr[this.counter-1].length;
                
                bot.changeRate(this.initialRate/10 * len + this.itemPause, true);
            }
        },

        queueTemplate(arr){
            this.mutateTextArr(arr);
            this.template = null;
            bot.cp.select.value = 'NONE';
        },

        setTemplate(temp){
            if(temp === 'waves') 
                this.queueTemplate([ "🎈", "🎈🎈", "🎈🎈🎈", "🎈🎈🎈🎈", "🎈🎈🎈🎈🎈", "🎈🎈🎈🎈", "🎈🎈🎈", "🎈🎈", "🎈"]);
            else if(temp === 'Bałkanica'){
                const text = `Bałkańska w żyłach płynie krew,
                kobiety, wino, taniec, śpiew.
                Zasady proste w życiu mam,
                nie rób drugiemu tego-
                czego ty nie chcesz sam!
                Muzyka, przyjaźń, radość, śmiech.
                Życie łatwiejsze staje się.
                Przynieście dla mnie wina dzban,
                potem ruszamy razem w tan.
                Będzie! Będzie zabawa!
                Będzie się działo!
                I znowu nocy będzie mało.
                Będzie głośno, będzie radośnie
                Znów przetańczymy razem całą noc.
                Będzie! Będzie zabawa!
                Będzie się działo!
                I znowu nocy będzie mało.
                Będzie głośno, będzie radośnie
                Znów przetańczymy razem całą noc.
                Orkiestra nie oszczędza sił
                już trochę im brakuje tchu.
                Polejcie wina również im
                znów na parkiecie będzie dym.
                Bałkańskie rytmy, Polska moc!
                Znów przetańczymy całą noc.
                I jeszcze jeden malutki wina dzban
                i znów ruszymy razem w tan!
                Będzie! Będzie zabawa!
                Będzie się działo!
                I znowu nocy będzie mało.
                Będzie głośno, będzie radośnie
                Znów przetańczymy razem całą noc.
                Będzie! Będzie zabawa!
                Będzie się działo!
                I znowu nocy będzie mało.
                Będzie głośno, będzie radośnie
                Znów przetańczymy razem całą noc.`;

                this.queueTemplate(text.split('\n'));
            } else if(temp === 'parrot' || temp === 'parrot+ ( | )'){
                this.template = (temp === 'parrot') ? temp : 'parrot+';
                const reply = bot.cp.replyBox;
                if(!reply.checked)
                    reply.click();
            } else if(temp !== 'NONE')
                this.template = temp;
            else
                this.template = null;
            
            this.reset();
        },

        mutateTextArr(newTextArr){
            this.textArr = newTextArr;
            this.updateList();
        },

        addMessage(msg){
            if(msg){
                const msgWithSpaces = msg.replace(/\s/g,'\xa0') //\xa0

                this.textArr.push(msgWithSpaces);
                this.updateList();
            }
        },

        removeMessage(id){
            this.textArr.splice(id, 1);
            this.updateList();
        },

        removeQueue(){
            this.textArr = ['🎈'];
            this.updateList();
        },

        updateList(){
            this.list.innerHTML = '';
            this.textArr.map((item, id) => {
                if(item && item !== ' ' && item !== '\n'){
                    const msg = document.createTextNode(item);
                    const msgNode = document.createElement('div');
                    msgNode.dataset.id = id;
                    msgNode.appendChild(msg);
                    msgNode.classList.add('bot--queue-item');
                    this.list.appendChild(msgNode);
                } else {
                    this.textArr.splice(id, 0);
                }
            });
            this.listLength = this.textArr.length;

            this.reset();
        },

        reset(){
            if(this.listLength){
                this.list.children[this.counter > this.listLength ? 0 : this.counter-1].classList.remove('bot--list-active-el');
                this.list.children[0].classList.add('bot--list-active-el');
            }
         
            this.counter = 1;
            this.msgCounter = 1;
            this.msg = '';
        },

        download(data, filename, type) {
            var file = new Blob([data], {type: type});
            if (window.navigator.msSaveOrOpenBlob) // IE10+
                window.navigator.msSaveOrOpenBlob(file, filename);
            else { // Others
                var a = document.createElement("a"),
                url = URL.createObjectURL(file);
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                setTimeout(function() {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);  
                }, 0); 
            }
        },

        export(sep){
            const data = this.textArr.join(sep);
            this.download(data, this.textArr ? this.textArr[0]+'.bot' : list+'.bot', 'text/plain');
        },

        import(sep, input){
            const isPlainText = (typeof input === 'string');

            const splitText = (text) => {
                if(sep === '\\n')
                    sep = '\n';
                
                const arr = text.split(sep);
                this.mutateTextArr(arr);
            }

            if(!isPlainText){
                const processFile = (e) => {
                    const text = e.target.result;
                    splitText(text);
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

        init(){
            this.input = bot.inp;
            this.list = bot.cp.list;
            this.initialRate = bot.rate;
        }
    },

    start(){
        this.stop();

        this.cp.btn.style.setProperty('background','green');

        this.text.realTypeSetup();

        this.botInterval = setInterval( () => {
            this.runSetup();
        
        }, this.rate);

        if(this.text.isFakeType){

            let state = 1;

            this.fakeTypeInterval = setInterval( () => {
                state++;
                if(state > 3) state = 1;
                
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
 
        this.isRunning = true;
    },
    
    stop(){
        if(this.isRunning){
            this.cp.btn.style.setProperty('background','red')
            clearInterval(this.botInterval);
            clearInterval(this.fakeTypeInterval);
            this.botInterval = 0;
            this.fakeTypeInterval = 0;
            this.isRunning = false;
        }
    },

    runSetup(){
        if(this.text.isReplyMode){
            try {
                if(this.log.lastChild.classList.contains(this.strangerMsgClass) || (this.text.isReplyAll && this.text.counter > 1)){
                    this.text.insert();
                    this.sendMsg();
                }
            } catch(err){}
        } else {
            this.text.insert();
            this.sendMsg();
        }
        this.leaveIfDisconnected();

        this.isFirstRun = false;

        if(this.text.isRealType) this.start();
    },

    sendMsg(){
        // if(this.btn){
        this.btn.click();
        const confirmBtn = document.querySelector('.sd-interface button');
        confirmBtn ? confirmBtn.click() : null;
        // } else {
        //     this.inp.dispatchEvent(new Event('focus'));
        //     this.inp.dispatchEvent(new KeyboardEvent('keypress',{keyCode:13}));
        // }
    },

    leaveIfDisconnected(){
        if(this.btn.classList.contains('disabled') && this.isAutoNext){
            this.btnEsc.click();
            this.text.reset();
        }
    },

    toggle(){
        if(this.isRunning){
            this.stop();
        } else {
            this.runSetup();
            this.start();
            this.isFirstRun = true;
        }
    },

    changeRate(rate, preserveOriginal){
        this.rate = rate;
        if(!preserveOriginal){
            this.text.initialRate = rate;
            const time = (this.rate<1000) ? (Math.floor(this.rate) +'ms') : ((this.rate/1000).toFixed(1) + 's');
            this.cp.rateGauge.textContent = time;
            //this.cp.rateController.value = time;
        }

        if(this.isRunning)
            this.start();
    },

    toggleAutoNext(){
        if(this.isAutoNext){
            this.cp.btnAutoNext.style.setProperty('background','red')
        } else {
            this.cp.btnAutoNext.style.setProperty('background','green')
        }

        this.isAutoNext = !this.isAutoNext;
    },
 
    init(inputQuery, btnQuery = null, btnEscQuery = null, messageAreaQuery = null, strangerMsgClass = null){
        this.btn = btnQuery ? document.querySelector(btnQuery) : null;
        this.btnEsc = btnEscQuery ? document.querySelector(btnEscQuery) : null;
        this.inp = inputQuery ? document.querySelector(inputQuery) : null;
        this.log = messageAreaQuery ? document.querySelector(messageAreaQuery) : null;
        this.strangerMsgClass = strangerMsgClass;
 
        this.cp.init();
        this.text.init();
        this.text.updateList();
    },
}
 
//6obcy
bot.init('#box-interface-input', 'button.o-any.o-send', 'button.o-any.o-esc', '#log-dynamic', 'log-stranger');

//e-chat.co
// bot.init('#InputTextArea', '#SendButton', 'null');
