//
// SimpleUsage.js — FunctionQueue
// today is 7/25/12, it is now 3:25 PM
// created by TotenDev
// see LICENSE for details.
//
	
var tap = require("tap");
//
tap.test("Basic push",function (t) {
	var FunctionQueue = require("./../src/function-queue.js")();
	t.plan(2);
	t.doesNotThrow(function () {
		FunctionQueue.push(function (callback) {
			t.ok(true,"first push call"); 
			callback();
		});
	});
	t.end();
});
//
tap.test("Basic push options",function (t) {
  var FunctionQueue = require("./../src/function-queue.js")();
  t.plan(3);
  t.doesNotThrow(function () {
    FunctionQueue.push(function (callback,arg) {
      t.ok(true,"first push call"); 
      t.equal(arg,"Hello buddy!","argument is okay")
      callback();
    },"Hello buddy!");
  });
  t.end();
});
//
tap.test("Push 2 times",function (t) {
	var FunctionQueue = require("./../src/function-queue.js")();
	t.plan(4);
	t.doesNotThrow(function () {
		FunctionQueue.push(function (callback) {
			t.ok(true,"first push call"); 
			callback();
		});
	});
	t.doesNotThrow(function () {
		FunctionQueue.push(function (callback) {
			t.ok(true,"second push call"); 
			callback();
		});
	});
	t.end();
});
//
tap.test("Push 2 times options",function (t) {
  var FunctionQueue = require("./../src/function-queue.js")();
  t.plan(6);
  t.doesNotThrow(function () {
    FunctionQueue.push(function (callback,arg) {
      t.ok(true,"first push call"); 
      t.equal(arg,"Hello buddy!","argument is okay")
      callback();
    },"Hello buddy!");
  });
  t.doesNotThrow(function () {
    FunctionQueue.push(function (callback,arg) {
      t.ok(true,"second push call"); 
      t.equal(arg,"Hey buddy.","argument is okay")
      callback();
    },"Hey buddy.");
  });
  t.end();
});
//
tap.test("Push 2 times timeout",function (t) {
	var FunctionQueue = require("./../src/function-queue.js")();
	t.plan(4);
	t.doesNotThrow(function () {
		FunctionQueue.push(function (callback) {
			setTimeout(function () {
				t.ok(true,"first push call"); 
				callback();
			},200);
		});
	});
	t.doesNotThrow(function () {
		FunctionQueue.push(function (callback) {
			setTimeout(function () {
				t.ok(true,"second push call"); 
				callback();
				t.end();
			},200);
		});
	});
});
//
tap.test("Push 2 times no callback call",function (t) {
	var FunctionQueue = require("./../src/function-queue.js")();
	t.plan(3);
	t.doesNotThrow(function () {
		FunctionQueue.push(function (callback) {
			setTimeout(function () {
				t.ok(true,"first push call"); 
				//Check if will not call second callback
				setTimeout(function () { t.end(); },200);
			},200);
		});
	});
	t.doesNotThrow(function () {
		FunctionQueue.push(function (callback) {
			t.ok(false,"reached second push function where shouldn't :("); 
		});
	});
});