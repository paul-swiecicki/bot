var bot = {
 
    botInterval: 0,
    rate: 500,
    isRunning: false,
    isAutoNext: false,

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

            this.all = document.createElement('div');
            this.all.id = 'bot--all-without-hide-btn'

            const createParentDivAndAppend = (el, childEl, parentEl = 'all') => { //childEl must be an array
                this[el] = document.createElement('div');

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

                createParentDivAndAppend(parentEl, [el]);
                this[parentEl].appendChild(document.createTextNode(label));
            }
            
            const createBtn = (btn, text, classes, clickFn, parentEl = 'all') => {
                this[btn] = document.createElement('button');
                this[btn].classList.add(...classes);
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
            createCheckbox('replyDiv','replyBox','setReply','Reply Mode ', false, false, (chked) => { this.replyAllBox.disabled = !chked });
            createCheckbox('replyAllDiv','replyAllBox','setReplyAll',' - Send whole queue', true, true);
            createCheckbox('randomDiv','randomBox','setRandom','Random');

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

            this.templates = document.createElement('div');
            this.templates.classList.add('bot--templates');
            this.select = document.createElement('select');

            const optionsArr = ['NONE','increment', 'waves', 'parrot', 'Bałkanica'];
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
            this.all.appendChild(this.templates);

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

            this.listForm = document.createElement('form');
            this.listForm.addEventListener('submit', e => {
                e.preventDefault();
                const msg = this.addToList.value;
                bot.text.addMessage(msg);

                this.addToList.value = '';
            });
            this.listForm.appendChild(this.upperDiv);
            this.listForm.appendChild(this.list);

            setTimeout(() => {
                Sortable.create(this.list, {
                    group: 'botQueue',
                    animation: 100
                });
            }, 3000)
            
            this.all.appendChild(this.listForm);

            this.expImp = document.createElement('div');
            this.exportDiv = document.createElement('div');
            this.importDiv = document.createElement('div');
            this.expImp.classList.add('bot--expimp');
            createBtn('exportBtn', '< Export >', ['bot--btn', 'bot--export'],
            e => {
                const sep = this.expSeparation.value;
                bot.text.export(sep);
            }, 'exportDiv');

            createBtn('importBtn', '> Import <', ['bot--btn', 'bot--import'],
            e => {
                const sep = this.impSeparation.value;
                const file = this.importFile.files;
                const text = this.importInput.value;

                const inp = text ? text : file;
                
                bot.text.import(sep, inp);
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
            this.exportDiv.classList.add('bot--import-div');
            this.importDiv.appendChild(this.impSeparation);
            this.importDiv.appendChild(this.importFile);

            // this.importForm = document.createElement('form');
            this.importInput = document.createElement('textarea');
            this.importInput.placeholder = 'Paste or type in some text to import';
            // this.importForm.appendChild(this.importInput);
            this.importDiv.appendChild(this.importInput);
            
            this.expImp.appendChild(this.exportDiv);
            this.expImp.appendChild(this.importDiv);
            this.all.appendChild(this.expImp);
            // this.all.appendChild(this.importFile);

            this.panel.appendChild(this.hideBtn);
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
                    width: 300px;
                    background: #0008;
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

                .bot--queue-item {
                    padding: 2px;
                    background: #fff9;
                    color: black;
                    border-top: 1px solid #777;
                    max-width: 100%;
                    overflow: auto;
                    cursor: pointer;
                }

                .bot--list-active-el {
                    background: #fffc;
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

                .bot--hide-btn {

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
        isReplyAll: true,
        isRandom: false,
        template: null,
        msg: '',

        insert(){
            if(this.isRandom) this.counter = Math.floor(Math.random()*this.listLength)+1;

            switch(this.template){
                case 'parrot': {
                    const strangerMsg = bot.log.lastChild.textContent;
                    const msg = strangerMsg.replace(/Obcy:\s/, '');
                    this.input.value = msg;
                } break;

                case 'increment': {
                    this.initialMsg = this.textArr[0];
                    this.msg += this.initialMsg;
                    this.input.value = this.msg;
                    this.msgCounter++;
                } break;

                default: {
                    if(this.listLength === 1){
                        if(!this.isRandom) this.counter = 1;
                        this.input.value = this.textArr[0];

                    } else if(this.listLength <= 0) {
                        bot.stop();

                    } else {
                        this.input.value = this.textArr[this.counter-1];
                        if(!this.isRandom) this.counter++;

                        if(this.counter > this.listLength){
                            if(!this.isRandom) this.counter = 1;
                            if(!this.loop) bot.stop();
                        }
                    }
                }
            }

            if(this.isRandom){
                this.counter = Math.floor(Math.random()*this.listLength)+1;
                this.list.children[this.counter-1].classList.add('bot--list-active-el');
                if(this.oldCounter !== this.counter) 
                    this.list.children[this.oldCounter-1].classList.remove('bot--list-active-el');
                this.oldCounter = this.counter;
                
            } else {
                this.list.children[this.counter-1].classList.add('bot--list-active-el');
                this.list.children[this.counter === 1 ? this.listLength-1 : this.counter-2].classList.remove('bot--list-active-el');
            }
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
        },

        queueTemplate(arr){
            this.mutateTextArr(arr);
            this.template = null;
            bot.cp.select.value = 'NONE';
        },

        setTemplate(temp){
            if(temp === 'waves') this.queueTemplate([ "🎈", "🎈🎈", "🎈🎈🎈", "🎈🎈🎈🎈", "🎈🎈🎈🎈🎈", "🎈🎈🎈🎈", "🎈🎈🎈", "🎈🎈", "🎈"]);
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
            } else if(temp === 'parrot'){
                this.template = 'parrot';
                bot.cp.replyBox.click();
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
                const msg = document.createTextNode(item);
                const msgNode = document.createElement('div');
                msgNode.dataset.id = id;
                msgNode.appendChild(msg);
                msgNode.classList.add('bot--queue-item');

                this.list.appendChild(msgNode);
            });
            this.listLength = this.textArr.length;

            this.reset();
        },

        reset(){
            this.list.children[this.counter-1].classList.remove('bot--list-active-el');
            this.list.children[0].classList.add('bot--list-active-el');
         
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
            const data = this.textArr.join(sep)
            this.download(data, this.textArr ? this.textArr : list+'.txt', 'text/plain');
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
        }
    },

    start(){
        this.stop();

        this.cp.btn.style.setProperty('background','green')

        this.botInterval = setInterval( () => {

            if(this.text.isReplyMode){
                try {
                    if(this.log.lastChild.classList.contains('log-stranger') || (this.text.isReplyAll && this.text.counter > 1)){
                        this.text.insert();
                        this.sendMsg();
                    }
                } catch(err){}
            } else {
                this.text.insert();
                this.sendMsg();
            }
            this.leaveIfDisconnected();
        
        }, this.rate)
 
        this.isRunning = true;
    },
    
    stop(){
        if(this.isRunning){
            this.cp.btn.style.setProperty('background','red')
            clearInterval(this.botInterval);
            this.botInterval = 0;
            this.isRunning = false;
            // this.text.reset();
        }
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
            this.start();
        }
    },

    changeRate(rate){
        this.rate = rate;
        const time = (this.rate<1000) ? (this.rate+'ms') : ((this.rate/1000).toFixed(1) + 's');
        this.cp.rateGauge.textContent = time;

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
 
    init(inputQuery, btnQuery = 0, btnEscQuery = 0){
        this.btn = btnQuery ? document.querySelector(btnQuery) : null;
        this.btnEsc = btnEscQuery ? document.querySelector(btnEscQuery) : null;
        this.inp = inputQuery ? document.querySelector(inputQuery) : null;
        this.log = document.querySelector('#log-dynamic');
 
        this.cp.init();
        this.text.init();
        this.text.updateList();
    },
}
 
//6obcy
bot.init('#box-interface-input', 'button.o-any.o-send', 'button.o-any.o-esc');

//e-chat.co
// bot.init('#InputTextArea', '#SendButton', 'null');
