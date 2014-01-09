/* Author:

*/
var dataServer = "http://" + window.location.hostname + ":" + window.location.port;
var ledgerView;
var ledgerItemFormView;

$(document).ready(function(){
	console.log("Started");
	ledgerItemFormView = new LedgerItemFormView();
	ledgerView = new LedgerView();
	ledgerProjectedBalanceView = new LedgerProjectedBalanceView();
});

var ledger;

var LedgerItem = Backbone.Model.extend({
    
});

var Ledger = Backbone.Collection.extend({
    model: LedgerItem,
    initialize: function(){

    },
    comparator:function(item){
    	return item.get("date");
    }
});

var LedgerItemView = Backbone.View.extend({
	tagName:"li",
    template: new EJS({url: 'templates/ledgerItem.ejs'}),
    editTemplate: new EJS({url: 'templates/editLedgerItem.ejs'}),
    render: function () {
        this.$el.html(this.template.render(this.model.toJSON()));
        this.$el.addClass(this.model.toJSON().type);
        return this;
    },

    events: {
        "click button.edit": "editLedgerItem",
        "click button.cancel": "cancelEdit",
        "click button.save": "saveEdits",
        "click button.delete": "deleteLedgerItem"
    },

    editLedgerItem: function (){
		this.$el.html(this.editTemplate.render(this.model.toJSON()));
		var myDate = Date.parse(this.$el.find("input.date").val().replace(" GMT-0500 (Eastern Standard Time)", ""));
		if(myDate === null){
			myDate = new Date(parseInt(this.$el.find("input.date").val()));
		}
		this.$el.find("input.date").val(myDate.toString("MM/dd/yyyy"));
		this.$el.find("input.time").val(myDate.toString("hh:mm"));
		this.$el.find("input.date").datetimepicker({altField:this.$el.find("input.time"), altFieldTimeOnly:true});

		this.select = ledgerView.createSelect().addClass("type").attr("dataName", "type").val(this.$el.find("#type").val()).appendTo(this.$el.find(".type"));
		this.$el.find("input[type='hidden']").remove();
		return this;
    },

    cancelEdit: function (){
		this.$el.html(this.template.render(this.model.toJSON()));
        return this;
    },

    saveEdits: function (e){
		var formData = {},
        prev = this.model.previousAttributes(),
        that = this;
		$(e.target).closest("li").find(":input").not("button").each(function () {
			var el = $(this);

			formData[el.attr("dataName")] = el.val();
		});

		formData.date = new Date(formData.date + " " + formData.time).getTime();
		delete formData.time;
		formData._id = this.model.attributes._id;
		console.log(formData);
		var data = {};
		data._id = this.model.attributes._id;
		data.item = formData;
		//update model
		$.ajax({
			url:dataServer + "/editLedgerItem",
			type:"POST",
			data: data,
			dataType:"JSON",
			complete:(function(item, formData){

				return function(data){
					//console.log("Delete Call Complete");
					console.log(data.responseText);
					console.log(formData);
					console.log(item);
					item.model.set(formData);
					//render view
					item.render();
				};
			})(that, formData)
		});
        
    },

    deleteLedgerItem: function (e){

		$.ajax({
			url:dataServer + "/deleteLedgerItem",
			type:"POST",
			data: this.model.toJSON(),
			dataType:"JSON",
			complete:(function(item){

				return function(data){
					//console.log("Delete Call Complete");
					console.log(data.responseText);
					item.trigger("delete");
				};

			})(this)
		});
	}
});

var LedgerView = Backbone.View.extend({
	el:$("#ledgerList"),
    initialize: function () {
		console.log("LedgerView Initialized");
        this.collection = new Ledger(ledger);
        this.collection.on("reset", this.render, this);
        this.collection.on("add", this.render, this);
        this.getData();

    },

    getData: function () {
		console.log("Getting Ledger");
		var that = this;
		$.ajax({
			url:dataServer + "/getLedger",
			dataType:"JSON",
			complete:function(data){
				var ledgerItems = $.parseJSON(data.responseText);
				console.log(ledgerItems);
				ledger = ledgerItems;
				that.collection.reset(ledger);
				ledgerProjectedBalanceView.getProjectedBalance();
			}
		});
    },

    render: function () {
        var that = this;
        this.$el.html("");
        this.addHeader();
        this.calculateBalances();
        _.each(this.collection.models, function (item) {
        	item.on("change:amount", that.render, that);
        	item.on("change:date", that.collection.sort, that.collection);
            that.renderLedgerItem(item);
        }, this);
        ledgerProjectedBalanceView.updatedProjectedBalanceView();
    },

    calculateBalances:function(){
        var balance = 0;
        _.each(this.collection.models, function (item) {
            if(item.get("type") === "balance"){
				balance = item.get("amount");
            }
            else if(item.get("type") === "income"){
            	balance += item.get("amount");
            }
            else {
            	balance -= item.get("amount");
            }
            item.set({balance:parseFloat(balance).toFixed(2)});
        }, this);
    },

    renderLedgerItem: function (item) {
		var that = this;
        var ledgerItemView = new LedgerItemView({
            model: item
        });
        ledgerItemView.on("delete", function(e){
			that.deleteLedgerItem(item);
        });
        this.$el.append(ledgerItemView.render().el);
    },

    getTypes: function () {
        return _.uniq(this.collection.pluck("type"), false, function (type) {
            return type.toLowerCase();
        });
    },

    addHeader: function (){
        var listHeader = $("<li />").addClass("list-header").html("Ledger");
        var header = $("<li />").addClass("header");
        header.html(new EJS({url: 'templates/ledgerItem.ejs'}).render({name:"Item Name", date:"Date", amount:"Amount", type:"Type", balance:"Balance"}));
        this.$el.append(listHeader);
        this.$el.append(ledgerItemFormView.el);
        ledgerItemFormView.render();
        ledgerItemFormView.delegateEvents();
        ledgerItemFormView.setDefaultValues();
        this.$el.append(header);
    },

    createSelect: function () {
        var select = $("<select/>");

        _.each(this.getTypes(), function (item) {
            var option = $("<option/>", {
                value: item.toLowerCase(),
                text: item.toLowerCase()
            }).appendTo(select);
        });

        return select;
    },

    addNewLedgerItem : function(newLedgerItem){
		this.collection.add(newLedgerItem);
		this.render();
    },

    deleteLedgerItem:function(item){
		this.collection.remove(item);
		this.render();
    }
});

var LedgerItemFormView = Backbone.View.extend({
	el:$("<li />"),
	initialize : function(){
		console.log("LedgerItemFormView Initlized")
	},

	render:function(){
		this.$el.html(new EJS({url: 'templates/addLedgerItem.ejs'}).render({})).appendTo("#ledgerList");
		this.$el.find("#itemdate").datetimepicker({altField:"#itemtime",altFieldTimeOnly:true});
		this.hideForm();
	},

	setDefaultValues:function(){
		//this.$el.find("#itemdate").val(new Date().toString("MM/dd/yyyy"));
		//this.$el.find("#itemtime").val(new Date().toString("hh:mm"));
		//this.$el.find("#itemname").val("Test Item");
		//this.$el.find("#itemamount").val("100.43");
	},

	events : {
		"click button.submit": "addLedgerItem",
		"click button.add": "showForm",
		"click button.cancel": "hideForm",
	},

	showForm:function(){
		this.$el.find("button.add").hide();
		this.$el.find("#ledgerForm").show();

		
		this.setDefaultValues();
	},

	hideForm:function(){
		this.$el.find("button.add").show();
		this.$el.find("#ledgerForm").hide();
	},

	addLedgerItem : function (){
		var that = this;
		var newLedgerItem = {};
		newLedgerItem.name = $("#itemname").val();
		newLedgerItem.date = Date.parse($("#itemdate").val() + " " + $("#itemtime").val()).getTime();
		newLedgerItem.amount = parseFloat($("#itemamount").val()).toFixed(2);
		newLedgerItem.type = $("#itemtype").val();

		if(newLedgerItem.name !== ""){
			$.ajax({
				url:dataServer + "/addLedgerItem",
				type:"POST",
				data:newLedgerItem,
				complete:function(data){
					console.log("Submission Complete");
					var newLedgerItem = $.parseJSON(data.responseText);
					console.log(newLedgerItem);
					ledgerView.addNewLedgerItem(newLedgerItem);
					that.hideForm.call(that);
				}
			});
		}
	}
});

var LedgerProjectedBalanceView = Backbone.View.extend({
	el:$("#projected-balance-container"),
	initialize:function(){
		console.log("LedgerProjectedBalanceView Initialized");
		var that = this;
		var now = new Date();
		this.$el.find(".projected-balance-input").datetimepicker({
			onClose: function(){
				that.updateProjectedBalance();
			}
		}).val(now.toString("MM/dd/yyyy hh:mm"));
	},
	getProjectedBalance:function(){
		var projectionModel = {
			name:"Projected Balance",
			date:new Date(this.$el.find(".projected-balance-input").val()).getTime(),
			type:"projection",
			amount:0
		};

		ledgerView.collection.add(projectionModel);
	},
	updateProjectedBalance:function(){
		var projectedBalanceModel = ledgerView.collection.where({name:"Projected Balance"});
		projectedBalanceModel[0].set({date:new Date(this.$el.find(".projected-balance-input").val()).getTime()});
	},
	updatedProjectedBalanceView:function(){
		var projectedBalanceModel = ledgerView.collection.where({name:"Projected Balance"});
		if(projectedBalanceModel[0]){
			this.$el.find("h3").html("$" + projectedBalanceModel[0].get("balance"));
		}
		
	}
});