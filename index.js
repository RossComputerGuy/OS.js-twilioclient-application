import osjs from "osjs";
import {name as applicationName} from "./metadata.json";

import {
	h,
	app
} from "hyperapp";

import {
	Box,BoxContainer,Button,Menu,Menubar,MenubarItem,TextField,TextareaField,Toolbar
} from "@osjs/gui";

const createConnectDialog = (core,callback) => {
	core.make("osjs/dialogs").create({
		buttons: ["ok","cancel"],
		window: { title: "Login", dimension: { width: 400, height: 250 } }
	},dialog => {
		return dialog.app.getState();
	},(btn,value) => {
		if(btn == "ok") return callback(value);
	}).render(($content,dialogWindow,dialog) => {
		dialog.app = app({
			session_id: "", token: ""
		},{
			setInput: ({name, value}) => () => ({[name]: value}),
			getState: () => state => state
		},
		(state,actions) => dialog.createView([
			h(Box,{ grow: 1, padding: false },[
				h(Box,{},[
					h(BoxContainer, {},"Session ID"),
					h(TextField,{
						value: state.session_id,
						oninput: (ev,value) => actions.setInput({ name: "session_id", value })
					})
				]),
				h(Box,{},[
					h(BoxContainer,{},"Token"),
					h(TextField,{ value: state.token, oninput: (ev,value) => actions.setInput({ name: "token", value })})
				])
			])
		]),$content);
	});
};

const createAboutDialog = core => {
	core.make("osjs/dialogs").create({
		buttons: ["ok"],
		window: { title: "Send Message", dimension: { width: 500, height: 200 } }
	},dialog => {
		return dialog.app.getState();
	},(btn,value) => {
		return value;
	}).render(($content,dialogWindow,dialog) => {
		dialog.app = app({
			from: "", to: "", body: ""
		},{
			setInput: ({ name, value }) => () => ({[name]: value}),
			getState: () => state => state
		},
		(state,actions) => dialog.createView([
			h(Box,{ grow: 1, padding: false },[
				h(BoxContainer,{},"Twilio Client - Version 1.0.0"),
				h(BoxContainer,{},"Developed By Spaceboy Ross (https://youtube.com/c/SpaceboyRoss)"),
				h(BoxContainer,{},"Licenced under Apache 2.0"),
				h(BoxContainer,{},"This app is designed for sending messages for Twilio in OS.js V3, it provides a simple interface to use and requires no documentation.")
			])
		]),$content);
	});
};

const createMessageDialog = (core,twilio) => {
	core.make("osjs/dialogs").create({
		buttons: ["ok","cancel"],
		window: { title: "Send Message", dimension: { width: 400, height: 390 } }
	},dialog => {
		return dialog.app.getState();
	},(btn,value) => {
		if(btn == "ok") return twilio.messages.create(value);
	}).render(($content,dialogWindow,dialog) => {
		dialog.app = app({
			from: "", to: "", body: ""
		},{
			setInput: ({ name, value }) => () => ({[name]: value}),
			getState: () => state => state
		},
		(state,actions) => dialog.createView([
			h(Box,{ grow: 1, padding: false },[
				h(Box,{},[
					h(BoxContainer, {},"From"),
					h(TextField,{
						value: state.from,
						oninput: (ev,value) => actions.setInput({ name: "from", value })
					})
				]),
				h(Box,{},[
					h(BoxContainer,{},"To"),
					h(TextField,{
						value: state.to,
						oninput: (ev,value) => actions.setInput({ name: "to", value })
					})
				]),
				h(Box,{},[
					h(BoxContainer,{},"Message"),
					h(TextareaField,{
						value: state.body,
						oninput: (ev,value) => actions.setInput({ name: "body", value })
					})
				])
			])
		]),$content);
	});
};

const createTwilio = async (core,proc,sid,token) => {
	const resp = await proc.request("/connect",{ method: "get", body: { token: token, sid: sid } });
	if(resp.type == "error") {
		core.make("osjs/dialog","alert",{ message: resp.message },(btn, value) => {});
		return null;
	}
	proc.settings.sid = sid;
	proc.settings.token = token;
	proc.saveSettings();
	return {
		messages: {
			create: async obj => {
				const resp = await proc.request("/messages/create",{ method: "get", body: obj });
				if(resp.type == "error") {
					core.make("osjs/dialog","alert",{ message: resp.message },(btn, value) => {});
					return null;
				}
				return resp.result;
			},
			list: async () => {
				const resp = await proc.request("/messages/list",{ method: "get" });
				if(resp.type == "error") {
					core.make("osjs/dialog","alert",{ message: resp.message },(btn, value) => {});
					return null;
				}
				return resp.result;
			}
		}
	};
};

const createWindow = (core,proc,metadata,twilio) => {
	proc.createWindow({
		id: "TwilioClientWindow",
		title: metadata.title.en_EN,
		dimension: { width: 400, height: 120 },
		position: { left: 700, top: 200 }
	}).on("destroy",() => proc.destroy()).render($content => {
		app({
		},{
			menuFile: ev => (state,actions) => {
				core.make("osjs/contextmenu").show({
					position: ev.target,
					menu: [
						{ label: "Delete Session ID and Token", onclick: () => {
							delete proc.settings.sid;
							delete proc.settings.token;
							proc.saveSettings().then(() => {
								proc.destroy();
							});
						} },
						{ label: "Quit", onclick: () => proc.destroy() }
					]
				});
			},
			menuAbout: ev => (state,actions) => {
				createAboutDialog(core);
			},
			newMessage: ev => (state,actions) => {
				createMessageDialog(core,twilio);
			}
		},
		(state,actions) => h(Box,{ grow: 1, padding: false },[
			h(Menubar,{},[
				h(MenubarItem,{ onclick: ev => actions.menuFile(ev) },"File"),
				h(MenubarItem,{ onclick: ev => actions.menuAbout(ev) },"About")
			]),
			h(Box,{},[
				h(Button,{ label: "New Message", onclick: ev => actions.newMessage(ev) })
			])
		]),$content);
	});
};

const register = async (core,args,options,metadata) => {
	const proc = core.make("osjs/application",{args,options,metadata});
	if(typeof(proc.settings.sid) == "undefined" || typeof(proc.settings.token) == "undefined") {
		createConnectDialog(core,val => createWindow(core,proc,metadata,createTwilio(core,proc,val.session_id,val.token)));
	} else createWindow(core,proc,metadata,createTwilio(core,proc,proc.settings.sid,proc.settings.token));
	return proc;
};

osjs.register(applicationName,register);
