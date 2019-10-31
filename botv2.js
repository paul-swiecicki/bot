var bot = {
 
    botInterval: 0,
    rate: 1000,
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
 
            this.hideBtn = document.createElement('span');
            this.hideBtn.appendChild(document.createTextNode('HIDE'))
            this.hideBtn.setAttribute('style',`
                padding: 5px;
                background: red;
                color: white;
                border: 2px solid white;
                cursor: pointer;
                margin: 0 0 10px;
            `);
            this.hideBtn.addEventListener('click', e => {
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
            this.panel.setAttribute('style',`
                padding: 10px;
                z-index: 1000;
                position: absolute;
                width: 300px;
            `);

            this.btn = document.createElement('button');
            this.btn.className = 'botSwitch';
            this.btn.appendChild(document.createTextNode('ON/OFF'))
            this.btn.setAttribute('style',`
                padding: 10px;
                background: red;
                color: white;
                border: 2px solid white;
                cursor: pointer;
            `);
            this.btn.addEventListener('click', e => {
                bot.toggle();
            });

            this.loopDiv = document.createElement('div');
            this.loopDiv.appendChild(document.createTextNode('Loop '))
            this.loopBox = document.createElement('input');
            this.loopBox.type = 'checkbox';
            this.loopBox.checked = true;
            this.loopBox.addEventListener('change', e => {
                if(e.target.checked){
                    bot.text.setLoop(true);
                } else {
                    bot.text.setLoop(false);
                }
            });
            this.loopDiv.appendChild(this.loopBox);

            this.rate = document.createElement('div');
            this.rate.setAttribute('style',`
                margin: 10px 0;
                color: white;
            `);
            this.rateText = document.createElement('div');
            this.rateText.appendChild(document.createTextNode(`Send once/${bot.rate}ms`));
            
            this.rateController = document.createElement('input');
            this.rateController.type = 'range';
            this.rateController.min = 0;
            this.rateController.max = 1000;
            this.rateController.value = 1000;
            this.rateController.step = 1;
            this.rateController.addEventListener('change', e => {
                let rate = e.target.value;
                bot.changeRate(rate);
            });
            this.rateController.setAttribute('style',`
                cursor: pointer;
                width: 100%;
            `);

            this.rate.appendChild(this.rateText);
            this.rate.appendChild(this.rateController);

            this.btnAutoNext = document.createElement('button');
            this.btnAutoNext.className = 'botSwitch';
            this.btnAutoNext.appendChild(document.createTextNode('Auto Next'))
            this.btnAutoNext.setAttribute('style',`
                padding: 2px;
                background: red;
                color: white;
                border: 2px solid white;
                cursor: pointer;
            `);
            this.btnAutoNext.addEventListener('click', e => {
                bot.toggleAutoNext();
            });

            this.listForm = document.createElement('form');
            this.upperDiv = document.createElement('div');

            this.addToList = document.createElement('input');
            this.addToList.placeholder = 'Add to message queue';
            this.addToList.setAttribute('style',`
                width: 70%;
            `);

            this.removeQueueBtn = document.createElement('div');
            this.removeQueueBtn.textContent = 'X';
            this.removeQueueBtn.setAttribute('style',`
                padding: 2px 6px;
                background: red;
                color: white;
                border: 2px solid white;
                cursor: pointer;
            `);
            this.removeQueueBtn.addEventListener('click', e => {
                bot.text.removeQueue();
            });

            this.list = document.createElement('div');
            this.list.addEventListener('click', e => {
                bot.text.removeMessage(e.target.dataset.id);
            });
            this.listForm.addEventListener('submit', e => {
                e.preventDefault();
                const msg = this.addToList.value;
                bot.text.addMessage(msg);

                this.addToList.value = '';
            });

            this.upperDiv.setAttribute('style',`
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 10px 0 5px;
            `);

            this.upperDiv.appendChild(this.addToList);
            this.upperDiv.appendChild(this.removeQueueBtn);

            this.listForm.appendChild(this.upperDiv);
            this.listForm.appendChild(this.list);

            this.all = document.createElement('div');
            this.all.setAttribute('style',`
                display: flex;
                flex-flow: column;
                justify-content: center;
                margin: 10px 0 0;
            `);

            this.all.appendChild(this.btn);
            this.all.appendChild(this.loopDiv);
            this.all.appendChild(this.rate);
            this.all.appendChild(this.btnAutoNext);
            this.all.appendChild(this.listForm);

            this.panel.appendChild(this.hideBtn);
            this.panel.appendChild(this.all);
            
            body.insertBefore(this.panel, body.firstChild);

            this.stylize();
        },

        stylize(){
            var css = `
                #botPanel {

                }
                
                
                
            `;

            var style = document.createElement('style');

            if (style.styleSheet) {
                style.styleSheet.cssText = css;
            } else {
                style.appendChild(document.createTextNode(css));
            }

            document.getElementsByTagName('head')[0].appendChild(style);
        }
    },

    text: {
        textArr: ['🎈'],
        input: '',
        counter: 1,
        loop: true,

        insert(){
            this.input = bot.inp;

            if(this.textArr.length === 1){
                this.counter = 1;
                this.input.value += this.textArr[0];

            } else {
                if(this.counter <= this.textArr.length){
                    this.input.value = this.textArr[this.counter-1];
                    this.counter++;

                } else if(!this.loop){
                    this.counter = 1;
                    bot.stop()

                } else {
                    this.input.value = this.textArr[0];
                    this.counter = 1;
                    // this.input.value += this.textArr[this.textArr.length];
                }
            }
        },

        setLoop(state){
            this.loop = state;
        },

        addMessage(msg){
            if(msg){
                this.textArr.push(msg);
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
            bot.cp.list.innerHTML = '';
            this.textArr.map((item, id) => {
                const msg = document.createTextNode(item);
                const msgNode = document.createElement('div');
                msgNode.dataset.id = id;
                msgNode.appendChild(msg);
                msgNode.setAttribute('style',`
                    padding: 2px;
                    background: #fff9;
                    color: black;
                    border-top: 1px solid #777;
                    max-width: 100%;
                    overflow: auto;
                    cursor: pointer;
                `);

                bot.cp.list.appendChild(msgNode);
            });
        }
    },

    start(){
        this.stop();

        this.cp.btn.style.setProperty('background','green')

        this.botInterval = setInterval( () => {

            this.text.insert();

            if(this.btn){
                this.btn.click();
            } else {
                this.inp.dispatchEvent(new Event('focus'));
                this.inp.dispatchEvent(new KeyboardEvent('keypress',{keyCode:13}));
            }

            if(this.btn.classList.contains('disabled') && this.isAutoNext)
                this.btnEsc.click();
        
        }, this.rate)
 
        this.isRunning = true;
    },
    
    stop(){
        if(this.isRunning){
            this.cp.btn.style.setProperty('background','red')
            clearInterval(this.botInterval);
            this.botInterval = 0;
            this.isRunning = false;
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
        //console.log(this.cp.rateText);
        this.cp.rateText.innerText = `Send once/${this.rate}ms`;

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
 
        this.cp.init();
        this.text.updateList();
    },
}
 
//6obcy
bot.init('#box-interface-input', 'button.o-any.o-send', 'button.o-any.o-esc');