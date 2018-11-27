const Twilio = require("twilio");

module.exports = (core,proc) => ({
	init: async () => {
		var twilio = null;
		core.app.get(proc.resource("/connect"),(req,res) => {
			if(Object.keys(req.params).length == 0) {
				var props = req._parsedUrl.query.split("&");
				for(var i = 0;i < props.length;i++) {
					var prop = props[i];
					var key = prop.split("=")[0];
					var value = prop.split("=")[1];
					req.params[key] = value;
				}
			}
			try {
				twilio = new Twilio(req.params.sid,req.params.token);
				res.json({ type: "success" });
			 } catch(err) {
			 	res.json({ type: "error", name: err.name, stack: err.stack, message: err.message });
			 }
		});
		core.app.get(proc.resource("/messages/create"),(req,res) => {
			if(Object.keys(req.params).length == 0) {
				var props = req._parsedUrl.query.split("&");
				for(var i = 0;i < props.length;i++) {
					var prop = props[i];
					var key = prop.split("=")[0];
					var value = prop.split("=")[1];
					req.params[key] = value;
				}
			}
			twilio.messages.create(req.params,(err,result) => {
				if(err) return res.json({ type: "error", name: err.name, stack: err.stack, message: err.message });
				res.json({ type: "success", result: result });
			});
		});
		core.app.get(proc.resource("/messages/list"),(req,res) => {
			if(Object.keys(req.params).length == 0) {
				var props = req._parsedUrl.query.split("&");
				for(var i = 0;i < props.length;i++) {
					var prop = props[i];
					var key = prop.split("=")[0];
					var value = prop.split("=")[1];
					req.params[key] = value;
				}
			}
			twilio.messages.list((err,result) => {
				if(err) return res.json({ type: "error", name: err.name, stack: err.stack, message: err.message });
				res.json({ type: "success", result: result });
			});
		});
	},
	start: () => {},
	destroy: () => {},
});
