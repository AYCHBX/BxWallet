// base view: contains all other views
UI.interface = function() {
  // create a screen object.
  screen = blessed.screen({smartCSR:true,dockBorders:true});
  screen.title = 'Internet of Coins wallet';

  // Create a box perfectly centered horizontally and vertically.
  UI.topbar = blessed.box({
    top: 0,
    left: '0%-1',
    width: '100%+1',
    height: 1,
    content: ' {bold}Internet of Coins{/bold}{|}{bold}{blue-fg}'+GL.session.userid.toUpperCase()+'{/blue-fg}{/bold}  ',
    tags: true,
    draggable: false,
    border: false,
    terminal: 'xterm-256color',
    fullUnicode: true,
    style: {
      fg: 'white', bg: 'blue'
    }
  });

  UI.lowbar = blessed.box({
    bottom: 0,
    left: '0%-1',
    width: '100%+1',
    height: 1,
    tags: true,
    draggable: false,
    border: false,
    terminal: 'xterm-256color',
    style: {
      fg: 'white', bg: 'blue'
    }
  });

  UI.box = blessed.box({
    top: 1,
    left: '0%',
    width: '100%',
    height: '100%-2',
    label: '',
    align: 'center',
    content: '',
    tags: true,
    keys: true,
    vi: false,
    mouse: true,
    draggable: false,
    border: false,
    terminal: 'xterm-256color',
    style: {
      fg: 'white',
      bg: 'transparent'
    },
    alwaysScroll:true,
    scrollable: true,
    scrollbar: {
      ch: ' ',
      track: {
        bg: 'yellow'
      },
      style: {
        inverse: true
      }
    }
  });

  //
  // Extra button handling
  //

  // Add functions to lowbar UI.edit
  UI.initLowbar = function() {
    UI.edit.Logger = UI.buttonfunc.make('log',UI.lowbar,0,0,lang.buttonLogger);
    UI.edit.Logger.on('press', function() {
      UI.logger.toggle();
      UI.logger.setFront();
      screen.render();
    });
    UI.edit.Terminal = UI.buttonfunc.make('terminal',UI.lowbar,'center',0,lang.buttonTerminal);
    UI.edit.Terminal.on('press', function() {
      UI.terminal.toggle();
      UI.terminal.setFront();
      if(!UI.terminal.hidden) {
        UI.terminal.line.focus();
      }
      screen.render();
    });
    UI.edit.Quit = UI.buttonfunc.make('quit',UI.lowbar,-1,0,lang.buttonQuit);
    UI.edit.Quit.on('press', function() {
      screen.destroy();
      process.exit(0);    // TODO: hard exit is not best solution; must be fixed!
    });
  }

  UI.clearElements = function () {
    UI.edit.box = [];
    for (var entry in UI.text) {
      if(typeof UI.text[entry]!=='undefined' && typeof UI.text[entry].destroy!=='undefined') {
        UI.text[entry].hide();
        UI.text[entry].destroy();
        delete UI.text[entry];
      }
    }
    for (var entry in UI.edit) {
      if(typeof UI.edit[entry]!=='undefined' && typeof UI.edit[entry].destroy!=='undefined') {
        UI.edit[entry].hide();
        UI.edit[entry].destroy();
        delete UI.edit[entry];
      }
    }
    UI.initLowbar();
    screen.render();
  }

  UI.scrollWindow = function (window,y) {
    var scroll = window.getScroll();
    var height = window.getScrollHeight();
    if(y+1>scroll) {
      window.setScrollPerc((y/height)*100);
    }
    /* SCROLLING UP ALREADY WORKS AUTOMATICALLY (BUGGY LIBS)
    if(y-1<scroll && !(y+2>scroll)) {
      window.setScrollPerc(((scroll-(window.height/3))/height)*100);
    }
    */
  }

  UI.modal = blessed.box({
    parent: UI.box,
    mouse: true,
    keys: true,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    label: '',
    align: 'center',
    content: '',
    draggable: false,
    hidden: true,
    border: false,
    transparent: true
  });

  UI.logger = blessed.log({
    parent: UI.box,
    top: 'center',
    left: 'center',
    width: '80%',
    height: '80%',
    label: '{bold} Log {/bold}',
    border: 'line',
    tags: true,
    keys: true,
    vi: true,
    mouse: true,
    draggable: false,
    hidden: true,
    scrollback: 100,
    scrollbar: {
      ch: ' ',
      track: {
        bg: 'yellow'
      },
      style: {
        inverse: true
      }
    }
  });

  UI.logger.key(['escape'], function(ch, key) {
    UI.logger.toggle();
    UI.activated.focus();
    screen.render();
  });

  UI.terminal = blessed.box({
    parent: UI.box,
    top: 'center',
    left: 'center',
    width: '80%',
    height: '80%',
    padding: {bottom:1},
    label: '{bold} API Terminal {/bold}',
    border: 'line',
    tags: true,
    hidden: true,
  });

  UI.terminal.hist = blessed.log({
    parent: UI.terminal,
    top: 0,
    left: 0,
    width: '100%-2',
    height: '100%-3',
    border: false,
    tags: true,
    keys: true,
    vi: true,
    mouse: true,
    draggable: false,
    content: lang.terminalDescription+'\n',
    scrollback: 100,
    scrollbar: {
      ch: ' ',
      track: {
        bg: 'yellow'
      },
      style: {
        inverse: true,
        bg: 'black'
      }
    }
  });

  UI.terminal.line = blessed.textbox({
    parent: UI.terminal,
    mouse: true,
    bottom: -1,
    left: 0,
    width: '100%-2',
    height: 1,
    align: 'left',
    style: {
      fg: 'black', bg: 'white'
    }
  });

  UI.terminal.cmdindex = 0;
  UI.terminal.cmds = [];
  UI.terminal.lastresult = {};

  UI.terminal.line.on('focus', function() {
    UI.terminal.line.readInput();
  });

  UI.terminal.line.key(['pageup'], function(ch, key) {
    UI.terminal.hist.scroll(-5);
    screen.render();
  });

  UI.terminal.line.key(['pagedown'], function(ch, key) {
    UI.terminal.hist.scroll(5);
    screen.render();
  });

  UI.terminal.line.key(['up'], function(ch, key) {
    if(UI.terminal.cmdindex>0) {
      UI.terminal.cmdindex-=1;
    }
    UI.terminal.line.setValue(UI.terminal.cmds[UI.terminal.cmdindex]);
    screen.render();
  });

  UI.terminal.line.key(['down'], function(ch, key) {
    if(UI.terminal.cmdindex<UI.terminal.cmds.length) {
      UI.terminal.cmdindex+=1;
      UI.terminal.line.setValue(UI.terminal.cmds[UI.terminal.cmdindex]);
    } else {
      UI.terminal.line.setValue('');
    }
    screen.render();
  });

  UI.terminal.line.key(['enter'], function(ch, key) {
    var command = UI.terminal.line.getValue();
    if(command=='' && typeof UI.terminal.lastresult.id != 'undefined') {
      if(UI.terminal.lastresult.id=='id') {
        command = '/proc/'+UI.terminal.lastresult.data;
      }
    }
    UI.terminal.cmds.push(command);
    if(UI.terminal.cmds.length>1000) {
      UI.terminal.cmds.shift();
    }
    UI.terminal.cmdindex=UI.terminal.cmds.length;
    UI.terminal.line.setValue('');
    UI.terminal.line.focus();
    screen.render();
    var cur_step = next_step();
    var usercrypto = { user_keys: GL.session.user_keys, nonce: GL.session.nonce };
    logger('[terminal TX]\n'+path+zchan(usercrypto,cur_step,command));
    najax({ url: nodepath+zchan(usercrypto,cur_step,command),
      success: function(object) {
        logger('[terminal RX]\n'+object);
        object = zchan_obj(usercrypto,cur_step,object);
        UI.terminal.lastresult = object;
        UI.terminal.hist.insertBottom(JSON.stringify(object)+'\n');
        UI.terminal.hist.scroll(5);
        screen.render();
      },
      failure: function(object) {
        UI.terminal.hist.insertBottom('{red}Error: remote node not responding!{/red}');
        screen.render();
      }
    });
  });

  UI.terminal.line.key(['escape'], function(ch, key) {
    UI.terminal.toggle();
    UI.activated.focus();
    screen.render();
  });


  UI.activated = UI.box;

  // fill local usercrypto object with keys and nonce later on
  GL.usercrypto = { user_keys: GL.session.user_keys, nonce: GL.session.nonce };

  // retrieve modes supported by node
  GL.cur_step = next_step();
  najax({url: nodepath+zchan(GL.usercrypto,GL.cur_step,'l/asset/modes'), timeout: 8000,
    success: function(object){
      object = zchan_obj(GL.usercrypto,GL.cur_step,object);
      GL.assetmodes=object.data;
      // retrieve names supported by node
      GL.cur_step = next_step();
      najax({url: nodepath+zchan(GL.usercrypto,GL.cur_step,'l/asset/names'), timeout: 8000,
        success: function(object){
          object = zchan_obj(GL.usercrypto,GL.cur_step,object);
          GL.assetnames=object.data;

          // Switch to assets view
          UI.views.assets();

        }
      });
    }
  });

  // Don't render interface.
  if(Object.keys(globals.transactionDetails).length !== 0 || globals.newAsset !== null || globals.addressToGet !== null) {
    return
  }

  // Append our elements to the screen.
  screen.append(UI.topbar);
  screen.append(UI.lowbar);
  screen.append(UI.box);

  //
  // Keyboard handling (global)
  //

  setTimeout(function() {

    // Cycle between button groups
    screen.key(['tab', 'f', '>'], function(ch, key) {
      UI.edit.group++;
      if(UI.edit.group>=UI.edit.cycles.length) { UI.edit.group=0; }
      UI.edit.ocycl=UI.edit.cycle;
      UI.edit.cycle=UI.edit.cycles[UI.edit.group];
      UI.edit.cfast = UI.edit.updown[UI.edit.group];
      UI.edit.focus = Math.floor(UI.edit.focus*(UI.edit.cycle.length/UI.edit.ocycl.length));
      UI.edit.focus = (UI.edit.focus<0?0:(UI.edit.focus>=UI.edit.cycle.length?UI.edit.cycle.length-1:UI.edit.focus));
      if(typeof UI.edit[UI.edit.cycle[UI.edit.focus]] != 'undefined') {
        UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
      }
    });

    screen.key(['S-tab', 'r', '<'], function(ch, key) {
      UI.edit.group--;
      if(UI.edit.group<0) { UI.edit.group=UI.edit.cycles.length-1; }
      UI.edit.ocycl=UI.edit.cycle;
      UI.edit.cycle=UI.edit.cycles[UI.edit.group];
      UI.edit.cfast = UI.edit.updown[UI.edit.group];
      UI.edit.focus = Math.floor(UI.edit.focus*(UI.edit.cycle.length/UI.edit.ocycl.length));
      UI.edit.focus = (UI.edit.focus<0?0:(UI.edit.focus>=UI.edit.cycle.length?UI.edit.cycle.length-1:UI.edit.focus));
      if(typeof UI.edit[UI.edit.cycle[UI.edit.focus]] != 'undefined') {
        UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
      }
    });

    // Cycle left/right between UI.edit
    screen.key(['right', 'd', '.'], function(ch, key) {
      if(UI.edit.override) {
        UI.edit.override = false;
      } else {
        UI.edit.focus++;
        if(UI.edit.focus>=UI.edit.cycle.length) { UI.edit.focus=-1; }
        if(typeof UI.edit.cycle[UI.edit.focus]!='undefined') {
          UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
        } else {
          UI.activated.focus();
        }
        screen.render();
      }
    });

    screen.key(['left', 'a', ','], function(ch, key) {
      if(UI.edit.override) {
        UI.edit.override = false;
      } else {
        UI.edit.focus--;
        if(UI.edit.focus<-1) { UI.edit.focus=UI.edit.cycle.length-1; }
        if(typeof UI.edit.cycle[UI.edit.focus]!='undefined') {
          UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
        } else {
          UI.activated.focus();
        }
        screen.render();
      }
    });

    // Cycle up/down between UI.edit
    screen.key(['down', 's', '}'], function(ch, key) {
      if(UI.edit.override) {
        UI.edit.override = false;
      } else {
        UI.edit.focus=UI.edit.focus+UI.edit.cfast;
        if(UI.edit.focus>UI.edit.cycle.length-1) { UI.edit.focus=UI.edit.focus-UI.edit.cycle.length; }
        if(UI.edit.focus<0) { UI.edit.focus=UI.edit.cycle.length-UI.edit.cfast; }
        if(typeof UI.edit.cycle[UI.edit.focus]!='undefined') {
          UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
        } else {
          UI.activated.focus();
        }
        screen.render();
      }
    });

    screen.key(['up', 'w', '{'], function(ch, key) {
      if(UI.edit.override) {
        UI.edit.override = false;
      } else {
        UI.edit.focus=UI.edit.focus-UI.edit.cfast;
        if(UI.edit.focus<0) { UI.edit.focus=UI.edit.focus+UI.edit.cycle.length; }
        if(UI.edit.focus>UI.edit.cycle.length-1) { UI.edit.focus=UI.edit.focus-UI.edit.cycle.length; }
        if(typeof UI.edit.cycle[UI.edit.focus]!='undefined') {
          UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
        } else {
          UI.activated.focus();
        }
        screen.render();
      }
    });

    // Cycle up/down between UI.edit
    screen.key(['pagedown', 't', ')'], function(ch, key) {
      if(UI.edit.override) {
        UI.edit.override = false;
      } else {
        UI.edit.focus=UI.edit.focus+(UI.edit.cfast*10);
        if(UI.edit.focus>UI.edit.cycle.length-1) { UI.edit.focus=UI.edit.cycle.length-1; }
        if(UI.edit.focus<0) { UI.edit.focus=0; }
        if(typeof UI.edit.cycle[UI.edit.focus]!='undefined') {
          UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
        } else {
          UI.activated.focus();
        }
        screen.render();
      }
    });

    screen.key(['pageup', 'g', '('], function(ch, key) {
      if(UI.edit.override) {
        UI.edit.override = false;
      } else {
        UI.edit.focus=UI.edit.focus-(UI.edit.cfast*10);
        if(UI.edit.focus<0) { UI.edit.focus=UI.edit.focus+UI.edit.cycle.length; }
        if(UI.edit.focus>UI.edit.cycle.length-1) { UI.edit.focus=UI.edit.cycle.length-1; }
        if(typeof UI.edit.cycle[UI.edit.focus]!='undefined') {
          UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
        } else {
          UI.activated.focus();
        }
        screen.render();
      }
    });

    // Cycle home/end between UI.edit
    screen.key(['end', 'S', '['], function(ch, key) {
      if(UI.edit.override) {
        UI.edit.override = false;
      } else {
        UI.edit.focus=UI.edit.cycle.length-1;
        UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
        screen.render();
      }
    });

    screen.key(['home', 'W', ']'], function(ch, key) {
      if(UI.edit.override) {
        UI.edit.override = false;
      } else {
        UI.edit.focus=0;
        UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
        screen.render();
      }
    });

    // Quit on Escape, q, or Control-C.
    screen.key(['q', 'Q'], function(ch, key) {
      screen.destroy();
      process.exit(0);    // TODO: hard exit is not best solution; must be fixed!
    });

    // Restart wallet app
    screen.key(['S-r'], function(ch, key) {
      screen.destroy();
      process.exit(255);    // TODO: hard exit is not best solution; must be fixed!
    });

    // Toggle log display
    screen.key(['l', 'L'], function(ch, key) {
      UI.logger.toggle();
      UI.logger.setFront();
      UI.logger.focus();
      screen.render();
    });

    // Toggle terminal display
    screen.key(['t', 'T'], function(ch, key) {
      UI.terminal.toggle();
      UI.terminal.setFront();
      if(!UI.terminal.hidden) {
        UI.terminal.line.focus();
      }
      screen.render();
    });

    // DEBUG KEYPRESSES
    /* screen.on('keypress', function(ch, key) {
      logger('KEY: '+ch+' '+JSON.stringify(key));
    }); */

  },3000);

  // Focus our element.
  UI.activated.focus();

  // Render the screen.
  screen.render();
}