//
// SimpleUsage.js — FunctionQueue
// today is 7/25/12, it is now 3:25 PM
// created by TotenDev
// see LICENSE for details.
//
	
var tap = require("tap");
//
tap.test("Push 2 Instances, block queue",function (t) {
	var FunctionQueue = require("./../src/function-queue.js")();
	var FunctionQueue2 = require("./../src/function-queue.js")();
	t.plan(5);
	t.doesNotThrow(function () {
		FunctionQueue.push(function (callback) {
			t.ok(true,"first push call (queue1)"); 
		});
		FunctionQueue2.push(function (callback) {
			t.ok(true,"first push call (queue2)"); 
			callback();
		});
	});
	t.doesNotThrow(function () {
		FunctionQueue.push(function (callback) {
			t.ok(false,"Should not reach here, since callback is not called on first push (queue1)"); callback();
		});
		FunctionQueue2.push(function (callback) {
			t.ok(true,"second push call (queue2)"); 
			callback();
		});
	});
	t.end();
});
//
tap.test("Push 2 Instances",function (t) {
	var FunctionQueue = require("./../src/function-queue.js")();
	var FunctionQueue2 = require("./../src/function-queue.js")();
	t.plan(6);
	t.doesNotThrow(function () {
		FunctionQueue.push(function (callback) {
			t.ok(true,"first push call (queue1)"); callback();
		});
		FunctionQueue2.push(function (callback) {
			t.ok(true,"first push call (queue2)");  callback();
		});
	});
	t.doesNotThrow(function () {
		FunctionQueue.push(function (callback) {
			t.ok(true,"second push call (queue1)"); callback();
		});
		FunctionQueue2.push(function (callback) {
			t.ok(true,"second push call (queue2)");  callback();
		});
	});
	t.end();
});