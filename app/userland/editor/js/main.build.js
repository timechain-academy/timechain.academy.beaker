(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var AwaitLock = _interopDefault(require('await-lock'));
var datServeResolvePath = _interopDefault(require('@beaker/dat-serve-resolve-path'));

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const directives = new WeakMap();
/**
 * Brands a function as a directive so that lit-html will call the function
 * during template rendering, rather than passing as a value.
 *
 * @param f The directive factory function. Must be a function that returns a
 * function of the signature `(part: Part) => void`. The returned function will
 * be called with the part object
 *
 * @example
 *
 * ```
 * import {directive, html} from 'lit-html';
 *
 * const immutable = directive((v) => (part) => {
 *   if (part.value !== v) {
 *     part.setValue(v)
 *   }
 * });
 * ```
 */
// tslint:disable-next-line:no-any
const directive = (f) => ((...args) => {
    const d = f(...args);
    directives.set(d, true);
    return d;
});
const isDirective = (o) => {
    return typeof o === 'function' && directives.has(o);
};
//# =directive.js.map

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * True if the custom elements polyfill is in use.
 */
const isCEPolyfill = window.customElements !== undefined &&
    window.customElements.polyfillWrapFlushCallback !==
        undefined;
/**
 * Reparents nodes, starting from `startNode` (inclusive) to `endNode`
 * (exclusive), into another container (could be the same container), before
 * `beforeNode`. If `beforeNode` is null, it appends the nodes to the
 * container.
 */
const reparentNodes = (container, start, end = null, before = null) => {
    let node = start;
    while (node !== end) {
        const n = node.nextSibling;
        container.insertBefore(node, before);
        node = n;
    }
};
/**
 * Removes nodes, starting from `startNode` (inclusive) to `endNode`
 * (exclusive), from `container`.
 */
const removeNodes = (container, startNode, endNode = null) => {
    let node = startNode;
    while (node !== endNode) {
        const n = node.nextSibling;
        container.removeChild(node);
        node = n;
    }
};
//# =dom.js.map

/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * A sentinel value that signals that a value was handled by a directive and
 * should not be written to the DOM.
 */
const noChange = {};
/**
 * A sentinel value that signals a NodePart to fully clear its content.
 */
const nothing = {};
//# =part.js.map

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * An expression marker with embedded unique key to avoid collision with
 * possible text in templates.
 */
const marker = `{{lit-${String(Math.random()).slice(2)}}}`;
/**
 * An expression marker used text-positions, multi-binding attributes, and
 * attributes with markup-like text values.
 */
const nodeMarker = `<!--${marker}-->`;
const markerRegex = new RegExp(`${marker}|${nodeMarker}`);
/**
 * Suffix appended to all bound attribute names.
 */
const boundAttributeSuffix = '$lit$';
/**
 * An updateable Template that tracks the location of dynamic parts.
 */
class Template {
    constructor(result, element) {
        this.parts = [];
        this.element = element;
        let index = -1;
        let partIndex = 0;
        const nodesToRemove = [];
        const _prepareTemplate = (template) => {
            const content = template.content;
            // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be
            // null
            const walker = document.createTreeWalker(content, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
            // Keeps track of the last index associated with a part. We try to delete
            // unnecessary nodes, but we never want to associate two different parts
            // to the same index. They must have a constant node between.
            let lastPartIndex = 0;
            while (walker.nextNode()) {
                index++;
                const node = walker.currentNode;
                if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
                    if (node.hasAttributes()) {
                        const attributes = node.attributes;
                        // Per
                        // https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
                        // attributes are not guaranteed to be returned in document order.
                        // In particular, Edge/IE can return them out of order, so we cannot
                        // assume a correspondance between part index and attribute index.
                        let count = 0;
                        for (let i = 0; i < attributes.length; i++) {
                            if (attributes[i].value.indexOf(marker) >= 0) {
                                count++;
                            }
                        }
                        while (count-- > 0) {
                            // Get the template literal section leading up to the first
                            // expression in this attribute
                            const stringForPart = result.strings[partIndex];
                            // Find the attribute name
                            const name = lastAttributeNameRegex.exec(stringForPart)[2];
                            // Find the corresponding attribute
                            // All bound attributes have had a suffix added in
                            // TemplateResult#getHTML to opt out of special attribute
                            // handling. To look up the attribute value we also need to add
                            // the suffix.
                            const attributeLookupName = name.toLowerCase() + boundAttributeSuffix;
                            const attributeValue = node.getAttribute(attributeLookupName);
                            const strings = attributeValue.split(markerRegex);
                            this.parts.push({ type: 'attribute', index, name, strings });
                            node.removeAttribute(attributeLookupName);
                            partIndex += strings.length - 1;
                        }
                    }
                    if (node.tagName === 'TEMPLATE') {
                        _prepareTemplate(node);
                    }
                }
                else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
                    const data = node.data;
                    if (data.indexOf(marker) >= 0) {
                        const parent = node.parentNode;
                        const strings = data.split(markerRegex);
                        const lastIndex = strings.length - 1;
                        // Generate a new text node for each literal section
                        // These nodes are also used as the markers for node parts
                        for (let i = 0; i < lastIndex; i++) {
                            parent.insertBefore((strings[i] === '') ? createMarker() :
                                document.createTextNode(strings[i]), node);
                            this.parts.push({ type: 'node', index: ++index });
                        }
                        // If there's no text, we must insert a comment to mark our place.
                        // Else, we can trust it will stick around after cloning.
                        if (strings[lastIndex] === '') {
                            parent.insertBefore(createMarker(), node);
                            nodesToRemove.push(node);
                        }
                        else {
                            node.data = strings[lastIndex];
                        }
                        // We have a part for each match found
                        partIndex += lastIndex;
                    }
                }
                else if (node.nodeType === 8 /* Node.COMMENT_NODE */) {
                    if (node.data === marker) {
                        const parent = node.parentNode;
                        // Add a new marker node to be the startNode of the Part if any of
                        // the following are true:
                        //  * We don't have a previousSibling
                        //  * The previousSibling is already the start of a previous part
                        if (node.previousSibling === null || index === lastPartIndex) {
                            index++;
                            parent.insertBefore(createMarker(), node);
                        }
                        lastPartIndex = index;
                        this.parts.push({ type: 'node', index });
                        // If we don't have a nextSibling, keep this node so we have an end.
                        // Else, we can remove it to save future costs.
                        if (node.nextSibling === null) {
                            node.data = '';
                        }
                        else {
                            nodesToRemove.push(node);
                            index--;
                        }
                        partIndex++;
                    }
                    else {
                        let i = -1;
                        while ((i = node.data.indexOf(marker, i + 1)) !==
                            -1) {
                            // Comment node has a binding marker inside, make an inactive part
                            // The binding won't work, but subsequent bindings will
                            // TODO (justinfagnani): consider whether it's even worth it to
                            // make bindings in comments work
                            this.parts.push({ type: 'node', index: -1 });
                        }
                    }
                }
            }
        };
        _prepareTemplate(element);
        // Remove text binding nodes after the walk to not disturb the TreeWalker
        for (const n of nodesToRemove) {
            n.parentNode.removeChild(n);
        }
    }
}
const isTemplatePartActive = (part) => part.index !== -1;
// Allows `document.createComment('')` to be renamed for a
// small manual size-savings.
const createMarker = () => document.createComment('');
/**
 * This regex extracts the attribute name preceding an attribute-position
 * expression. It does this by matching the syntax allowed for attributes
 * against the string literal directly preceding the expression, assuming that
 * the expression is in an attribute-value position.
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#attributes-0
 *
 * "\0-\x1F\x7F-\x9F" are Unicode control characters
 *
 * " \x09\x0a\x0c\x0d" are HTML space characters:
 * https://www.w3.org/TR/html5/infrastructure.html#space-character
 *
 * So an attribute is:
 *  * The name: any character except a control character, space character, ('),
 *    ("), ">", "=", or "/"
 *  * Followed by zero or more space characters
 *  * Followed by "="
 *  * Followed by zero or more space characters
 *  * Followed by:
 *    * Any character except space, ('), ("), "<", ">", "=", (`), or
 *    * (") then any non-("), or
 *    * (') then any non-(')
 */
const lastAttributeNameRegex = /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F \x09\x0a\x0c\x0d"'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;
//# =template.js.map

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * An instance of a `Template` that can be attached to the DOM and updated
 * with new values.
 */
class TemplateInstance {
    constructor(template, processor, options) {
        this._parts = [];
        this.template = template;
        this.processor = processor;
        this.options = options;
    }
    update(values) {
        let i = 0;
        for (const part of this._parts) {
            if (part !== undefined) {
                part.setValue(values[i]);
            }
            i++;
        }
        for (const part of this._parts) {
            if (part !== undefined) {
                part.commit();
            }
        }
    }
    _clone() {
        // When using the Custom Elements polyfill, clone the node, rather than
        // importing it, to keep the fragment in the template's document. This
        // leaves the fragment inert so custom elements won't upgrade and
        // potentially modify their contents by creating a polyfilled ShadowRoot
        // while we traverse the tree.
        const fragment = isCEPolyfill ?
            this.template.element.content.cloneNode(true) :
            document.importNode(this.template.element.content, true);
        const parts = this.template.parts;
        let partIndex = 0;
        let nodeIndex = 0;
        const _prepareInstance = (fragment) => {
            // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be
            // null
            const walker = document.createTreeWalker(fragment, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
            let node = walker.nextNode();
            // Loop through all the nodes and parts of a template
            while (partIndex < parts.length && node !== null) {
                const part = parts[partIndex];
                // Consecutive Parts may have the same node index, in the case of
                // multiple bound attributes on an element. So each iteration we either
                // increment the nodeIndex, if we aren't on a node with a part, or the
                // partIndex if we are. By not incrementing the nodeIndex when we find a
                // part, we allow for the next part to be associated with the current
                // node if neccessasry.
                if (!isTemplatePartActive(part)) {
                    this._parts.push(undefined);
                    partIndex++;
                }
                else if (nodeIndex === part.index) {
                    if (part.type === 'node') {
                        const part = this.processor.handleTextExpression(this.options);
                        part.insertAfterNode(node.previousSibling);
                        this._parts.push(part);
                    }
                    else {
                        this._parts.push(...this.processor.handleAttributeExpressions(node, part.name, part.strings, this.options));
                    }
                    partIndex++;
                }
                else {
                    nodeIndex++;
                    if (node.nodeName === 'TEMPLATE') {
                        _prepareInstance(node.content);
                    }
                    node = walker.nextNode();
                }
            }
        };
        _prepareInstance(fragment);
        if (isCEPolyfill) {
            document.adoptNode(fragment);
            customElements.upgrade(fragment);
        }
        return fragment;
    }
}
//# =template-instance.js.map

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * The return type of `html`, which holds a Template and the values from
 * interpolated expressions.
 */
class TemplateResult {
    constructor(strings, values, type, processor) {
        this.strings = strings;
        this.values = values;
        this.type = type;
        this.processor = processor;
    }
    /**
     * Returns a string of HTML used to create a `<template>` element.
     */
    getHTML() {
        const endIndex = this.strings.length - 1;
        let html = '';
        for (let i = 0; i < endIndex; i++) {
            const s = this.strings[i];
            // This exec() call does two things:
            // 1) Appends a suffix to the bound attribute name to opt out of special
            // attribute value parsing that IE11 and Edge do, like for style and
            // many SVG attributes. The Template class also appends the same suffix
            // when looking up attributes to create Parts.
            // 2) Adds an unquoted-attribute-safe marker for the first expression in
            // an attribute. Subsequent attribute expressions will use node markers,
            // and this is safe since attributes with multiple expressions are
            // guaranteed to be quoted.
            const match = lastAttributeNameRegex.exec(s);
            if (match) {
                // We're starting a new bound attribute.
                // Add the safe attribute suffix, and use unquoted-attribute-safe
                // marker.
                html += s.substr(0, match.index) + match[1] + match[2] +
                    boundAttributeSuffix + match[3] + marker;
            }
            else {
                // We're either in a bound node, or trailing bound attribute.
                // Either way, nodeMarker is safe to use.
                html += s + nodeMarker;
            }
        }
        return html + this.strings[endIndex];
    }
    getTemplateElement() {
        const template = document.createElement('template');
        template.innerHTML = this.getHTML();
        return template;
    }
}
//# =template-result.js.map

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const isPrimitive = (value) => {
    return (value === null ||
        !(typeof value === 'object' || typeof value === 'function'));
};
/**
 * Sets attribute values for AttributeParts, so that the value is only set once
 * even if there are multiple parts for an attribute.
 */
class AttributeCommitter {
    constructor(element, name, strings) {
        this.dirty = true;
        this.element = element;
        this.name = name;
        this.strings = strings;
        this.parts = [];
        for (let i = 0; i < strings.length - 1; i++) {
            this.parts[i] = this._createPart();
        }
    }
    /**
     * Creates a single part. Override this to create a differnt type of part.
     */
    _createPart() {
        return new AttributePart(this);
    }
    _getValue() {
        const strings = this.strings;
        const l = strings.length - 1;
        let text = '';
        for (let i = 0; i < l; i++) {
            text += strings[i];
            const part = this.parts[i];
            if (part !== undefined) {
                const v = part.value;
                if (v != null &&
                    (Array.isArray(v) ||
                        // tslint:disable-next-line:no-any
                        typeof v !== 'string' && v[Symbol.iterator])) {
                    for (const t of v) {
                        text += typeof t === 'string' ? t : String(t);
                    }
                }
                else {
                    text += typeof v === 'string' ? v : String(v);
                }
            }
        }
        text += strings[l];
        return text;
    }
    commit() {
        if (this.dirty) {
            this.dirty = false;
            this.element.setAttribute(this.name, this._getValue());
        }
    }
}
class AttributePart {
    constructor(comitter) {
        this.value = undefined;
        this.committer = comitter;
    }
    setValue(value) {
        if (value !== noChange && (!isPrimitive(value) || value !== this.value)) {
            this.value = value;
            // If the value is a not a directive, dirty the committer so that it'll
            // call setAttribute. If the value is a directive, it'll dirty the
            // committer if it calls setValue().
            if (!isDirective(value)) {
                this.committer.dirty = true;
            }
        }
    }
    commit() {
        while (isDirective(this.value)) {
            const directive = this.value;
            this.value = noChange;
            directive(this);
        }
        if (this.value === noChange) {
            return;
        }
        this.committer.commit();
    }
}
class NodePart {
    constructor(options) {
        this.value = undefined;
        this._pendingValue = undefined;
        this.options = options;
    }
    /**
     * Inserts this part into a container.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    appendInto(container) {
        this.startNode = container.appendChild(createMarker());
        this.endNode = container.appendChild(createMarker());
    }
    /**
     * Inserts this part between `ref` and `ref`'s next sibling. Both `ref` and
     * its next sibling must be static, unchanging nodes such as those that appear
     * in a literal section of a template.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    insertAfterNode(ref) {
        this.startNode = ref;
        this.endNode = ref.nextSibling;
    }
    /**
     * Appends this part into a parent part.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    appendIntoPart(part) {
        part._insert(this.startNode = createMarker());
        part._insert(this.endNode = createMarker());
    }
    /**
     * Appends this part after `ref`
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    insertAfterPart(ref) {
        ref._insert(this.startNode = createMarker());
        this.endNode = ref.endNode;
        ref.endNode = this.startNode;
    }
    setValue(value) {
        this._pendingValue = value;
    }
    commit() {
        while (isDirective(this._pendingValue)) {
            const directive = this._pendingValue;
            this._pendingValue = noChange;
            directive(this);
        }
        const value = this._pendingValue;
        if (value === noChange) {
            return;
        }
        if (isPrimitive(value)) {
            if (value !== this.value) {
                this._commitText(value);
            }
        }
        else if (value instanceof TemplateResult) {
            this._commitTemplateResult(value);
        }
        else if (value instanceof Node) {
            this._commitNode(value);
        }
        else if (Array.isArray(value) ||
            // tslint:disable-next-line:no-any
            value[Symbol.iterator]) {
            this._commitIterable(value);
        }
        else if (value === nothing) {
            this.value = nothing;
            this.clear();
        }
        else {
            // Fallback, will render the string representation
            this._commitText(value);
        }
    }
    _insert(node) {
        this.endNode.parentNode.insertBefore(node, this.endNode);
    }
    _commitNode(value) {
        if (this.value === value) {
            return;
        }
        this.clear();
        this._insert(value);
        this.value = value;
    }
    _commitText(value) {
        const node = this.startNode.nextSibling;
        value = value == null ? '' : value;
        if (node === this.endNode.previousSibling &&
            node.nodeType === 3 /* Node.TEXT_NODE */) {
            // If we only have a single text node between the markers, we can just
            // set its value, rather than replacing it.
            // TODO(justinfagnani): Can we just check if this.value is primitive?
            node.data = value;
        }
        else {
            this._commitNode(document.createTextNode(typeof value === 'string' ? value : String(value)));
        }
        this.value = value;
    }
    _commitTemplateResult(value) {
        const template = this.options.templateFactory(value);
        if (this.value instanceof TemplateInstance &&
            this.value.template === template) {
            this.value.update(value.values);
        }
        else {
            // Make sure we propagate the template processor from the TemplateResult
            // so that we use its syntax extension, etc. The template factory comes
            // from the render function options so that it can control template
            // caching and preprocessing.
            const instance = new TemplateInstance(template, value.processor, this.options);
            const fragment = instance._clone();
            instance.update(value.values);
            this._commitNode(fragment);
            this.value = instance;
        }
    }
    _commitIterable(value) {
        // For an Iterable, we create a new InstancePart per item, then set its
        // value to the item. This is a little bit of overhead for every item in
        // an Iterable, but it lets us recurse easily and efficiently update Arrays
        // of TemplateResults that will be commonly returned from expressions like:
        // array.map((i) => html`${i}`), by reusing existing TemplateInstances.
        // If _value is an array, then the previous render was of an
        // iterable and _value will contain the NodeParts from the previous
        // render. If _value is not an array, clear this part and make a new
        // array for NodeParts.
        if (!Array.isArray(this.value)) {
            this.value = [];
            this.clear();
        }
        // Lets us keep track of how many items we stamped so we can clear leftover
        // items from a previous render
        const itemParts = this.value;
        let partIndex = 0;
        let itemPart;
        for (const item of value) {
            // Try to reuse an existing part
            itemPart = itemParts[partIndex];
            // If no existing part, create a new one
            if (itemPart === undefined) {
                itemPart = new NodePart(this.options);
                itemParts.push(itemPart);
                if (partIndex === 0) {
                    itemPart.appendIntoPart(this);
                }
                else {
                    itemPart.insertAfterPart(itemParts[partIndex - 1]);
                }
            }
            itemPart.setValue(item);
            itemPart.commit();
            partIndex++;
        }
        if (partIndex < itemParts.length) {
            // Truncate the parts array so _value reflects the current state
            itemParts.length = partIndex;
            this.clear(itemPart && itemPart.endNode);
        }
    }
    clear(startNode = this.startNode) {
        removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode);
    }
}
/**
 * Implements a boolean attribute, roughly as defined in the HTML
 * specification.
 *
 * If the value is truthy, then the attribute is present with a value of
 * ''. If the value is falsey, the attribute is removed.
 */
class BooleanAttributePart {
    constructor(element, name, strings) {
        this.value = undefined;
        this._pendingValue = undefined;
        if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
            throw new Error('Boolean attributes can only contain a single expression');
        }
        this.element = element;
        this.name = name;
        this.strings = strings;
    }
    setValue(value) {
        this._pendingValue = value;
    }
    commit() {
        while (isDirective(this._pendingValue)) {
            const directive = this._pendingValue;
            this._pendingValue = noChange;
            directive(this);
        }
        if (this._pendingValue === noChange) {
            return;
        }
        const value = !!this._pendingValue;
        if (this.value !== value) {
            if (value) {
                this.element.setAttribute(this.name, '');
            }
            else {
                this.element.removeAttribute(this.name);
            }
        }
        this.value = value;
        this._pendingValue = noChange;
    }
}
/**
 * Sets attribute values for PropertyParts, so that the value is only set once
 * even if there are multiple parts for a property.
 *
 * If an expression controls the whole property value, then the value is simply
 * assigned to the property under control. If there are string literals or
 * multiple expressions, then the strings are expressions are interpolated into
 * a string first.
 */
class PropertyCommitter extends AttributeCommitter {
    constructor(element, name, strings) {
        super(element, name, strings);
        this.single =
            (strings.length === 2 && strings[0] === '' && strings[1] === '');
    }
    _createPart() {
        return new PropertyPart(this);
    }
    _getValue() {
        if (this.single) {
            return this.parts[0].value;
        }
        return super._getValue();
    }
    commit() {
        if (this.dirty) {
            this.dirty = false;
            // tslint:disable-next-line:no-any
            this.element[this.name] = this._getValue();
        }
    }
}
class PropertyPart extends AttributePart {
}
// Detect event listener options support. If the `capture` property is read
// from the options object, then options are supported. If not, then the thrid
// argument to add/removeEventListener is interpreted as the boolean capture
// value so we should only pass the `capture` property.
let eventOptionsSupported = false;
try {
    const options = {
        get capture() {
            eventOptionsSupported = true;
            return false;
        }
    };
    // tslint:disable-next-line:no-any
    window.addEventListener('test', options, options);
    // tslint:disable-next-line:no-any
    window.removeEventListener('test', options, options);
}
catch (_e) {
}
class EventPart {
    constructor(element, eventName, eventContext) {
        this.value = undefined;
        this._pendingValue = undefined;
        this.element = element;
        this.eventName = eventName;
        this.eventContext = eventContext;
        this._boundHandleEvent = (e) => this.handleEvent(e);
    }
    setValue(value) {
        this._pendingValue = value;
    }
    commit() {
        while (isDirective(this._pendingValue)) {
            const directive = this._pendingValue;
            this._pendingValue = noChange;
            directive(this);
        }
        if (this._pendingValue === noChange) {
            return;
        }
        const newListener = this._pendingValue;
        const oldListener = this.value;
        const shouldRemoveListener = newListener == null ||
            oldListener != null &&
                (newListener.capture !== oldListener.capture ||
                    newListener.once !== oldListener.once ||
                    newListener.passive !== oldListener.passive);
        const shouldAddListener = newListener != null && (oldListener == null || shouldRemoveListener);
        if (shouldRemoveListener) {
            this.element.removeEventListener(this.eventName, this._boundHandleEvent, this._options);
        }
        if (shouldAddListener) {
            this._options = getOptions(newListener);
            this.element.addEventListener(this.eventName, this._boundHandleEvent, this._options);
        }
        this.value = newListener;
        this._pendingValue = noChange;
    }
    handleEvent(event) {
        if (typeof this.value === 'function') {
            this.value.call(this.eventContext || this.element, event);
        }
        else {
            this.value.handleEvent(event);
        }
    }
}
// We copy options because of the inconsistent behavior of browsers when reading
// the third argument of add/removeEventListener. IE11 doesn't support options
// at all. Chrome 41 only reads `capture` if the argument is an object.
const getOptions = (o) => o &&
    (eventOptionsSupported ?
        { capture: o.capture, passive: o.passive, once: o.once } :
        o.capture);
//# =parts.js.map

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * Creates Parts when a template is instantiated.
 */
class DefaultTemplateProcessor {
    /**
     * Create parts for an attribute-position binding, given the event, attribute
     * name, and string literals.
     *
     * @param element The element containing the binding
     * @param name  The attribute name
     * @param strings The string literals. There are always at least two strings,
     *   event for fully-controlled bindings with a single expression.
     */
    handleAttributeExpressions(element, name, strings, options) {
        const prefix = name[0];
        if (prefix === '.') {
            const comitter = new PropertyCommitter(element, name.slice(1), strings);
            return comitter.parts;
        }
        if (prefix === '@') {
            return [new EventPart(element, name.slice(1), options.eventContext)];
        }
        if (prefix === '?') {
            return [new BooleanAttributePart(element, name.slice(1), strings)];
        }
        const comitter = new AttributeCommitter(element, name, strings);
        return comitter.parts;
    }
    /**
     * Create parts for a text-position binding.
     * @param templateFactory
     */
    handleTextExpression(options) {
        return new NodePart(options);
    }
}
const defaultTemplateProcessor = new DefaultTemplateProcessor();
//# =default-template-processor.js.map

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * The default TemplateFactory which caches Templates keyed on
 * result.type and result.strings.
 */
function templateFactory(result) {
    let templateCache = templateCaches.get(result.type);
    if (templateCache === undefined) {
        templateCache = {
            stringsArray: new WeakMap(),
            keyString: new Map()
        };
        templateCaches.set(result.type, templateCache);
    }
    let template = templateCache.stringsArray.get(result.strings);
    if (template !== undefined) {
        return template;
    }
    // If the TemplateStringsArray is new, generate a key from the strings
    // This key is shared between all templates with identical content
    const key = result.strings.join(marker);
    // Check if we already have a Template for this key
    template = templateCache.keyString.get(key);
    if (template === undefined) {
        // If we have not seen this key before, create a new Template
        template = new Template(result, result.getTemplateElement());
        // Cache the Template for this key
        templateCache.keyString.set(key, template);
    }
    // Cache all future queries for this TemplateStringsArray
    templateCache.stringsArray.set(result.strings, template);
    return template;
}
const templateCaches = new Map();
//# =template-factory.js.map

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const parts = new WeakMap();
/**
 * Renders a template to a container.
 *
 * To update a container with new values, reevaluate the template literal and
 * call `render` with the new result.
 *
 * @param result a TemplateResult created by evaluating a template tag like
 *     `html` or `svg`.
 * @param container A DOM parent to render to. The entire contents are either
 *     replaced, or efficiently updated if the same result type was previous
 *     rendered there.
 * @param options RenderOptions for the entire render tree rendered to this
 *     container. Render options must *not* change between renders to the same
 *     container, as those changes will not effect previously rendered DOM.
 */
const render = (result, container, options) => {
    let part = parts.get(container);
    if (part === undefined) {
        removeNodes(container, container.firstChild);
        parts.set(container, part = new NodePart(Object.assign({ templateFactory }, options)));
        part.appendInto(container);
    }
    part.setValue(result);
    part.commit();
};
//# =render.js.map

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for lit-html usage.
// TODO(justinfagnani): inject version number at build time
(window['litHtmlVersions'] || (window['litHtmlVersions'] = [])).push('1.0.0');
/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 */
const html = (strings, ...values) => new TemplateResult(strings, values, 'html', defaultTemplateProcessor);
//# =lit-html.js.map

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const walkerNodeFilter = 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */;
/**
 * Removes the list of nodes from a Template safely. In addition to removing
 * nodes from the Template, the Template part indices are updated to match
 * the mutated Template DOM.
 *
 * As the template is walked the removal state is tracked and
 * part indices are adjusted as needed.
 *
 * div
 *   div#1 (remove) <-- start removing (removing node is div#1)
 *     div
 *       div#2 (remove)  <-- continue removing (removing node is still div#1)
 *         div
 * div <-- stop removing since previous sibling is the removing node (div#1,
 * removed 4 nodes)
 */
function removeNodesFromTemplate(template, nodesToRemove) {
    const { element: { content }, parts } = template;
    const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
    let partIndex = nextActiveIndexInTemplateParts(parts);
    let part = parts[partIndex];
    let nodeIndex = -1;
    let removeCount = 0;
    const nodesToRemoveInTemplate = [];
    let currentRemovingNode = null;
    while (walker.nextNode()) {
        nodeIndex++;
        const node = walker.currentNode;
        // End removal if stepped past the removing node
        if (node.previousSibling === currentRemovingNode) {
            currentRemovingNode = null;
        }
        // A node to remove was found in the template
        if (nodesToRemove.has(node)) {
            nodesToRemoveInTemplate.push(node);
            // Track node we're removing
            if (currentRemovingNode === null) {
                currentRemovingNode = node;
            }
        }
        // When removing, increment count by which to adjust subsequent part indices
        if (currentRemovingNode !== null) {
            removeCount++;
        }
        while (part !== undefined && part.index === nodeIndex) {
            // If part is in a removed node deactivate it by setting index to -1 or
            // adjust the index as needed.
            part.index = currentRemovingNode !== null ? -1 : part.index - removeCount;
            // go to the next active part.
            partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
            part = parts[partIndex];
        }
    }
    nodesToRemoveInTemplate.forEach((n) => n.parentNode.removeChild(n));
}
const countNodes = (node) => {
    let count = (node.nodeType === 11 /* Node.DOCUMENT_FRAGMENT_NODE */) ? 0 : 1;
    const walker = document.createTreeWalker(node, walkerNodeFilter, null, false);
    while (walker.nextNode()) {
        count++;
    }
    return count;
};
const nextActiveIndexInTemplateParts = (parts, startIndex = -1) => {
    for (let i = startIndex + 1; i < parts.length; i++) {
        const part = parts[i];
        if (isTemplatePartActive(part)) {
            return i;
        }
    }
    return -1;
};
/**
 * Inserts the given node into the Template, optionally before the given
 * refNode. In addition to inserting the node into the Template, the Template
 * part indices are updated to match the mutated Template DOM.
 */
function insertNodeIntoTemplate(template, node, refNode = null) {
    const { element: { content }, parts } = template;
    // If there's no refNode, then put node at end of template.
    // No part indices need to be shifted in this case.
    if (refNode === null || refNode === undefined) {
        content.appendChild(node);
        return;
    }
    const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
    let partIndex = nextActiveIndexInTemplateParts(parts);
    let insertCount = 0;
    let walkerIndex = -1;
    while (walker.nextNode()) {
        walkerIndex++;
        const walkerNode = walker.currentNode;
        if (walkerNode === refNode) {
            insertCount = countNodes(node);
            refNode.parentNode.insertBefore(node, refNode);
        }
        while (partIndex !== -1 && parts[partIndex].index === walkerIndex) {
            // If we've inserted the node, simply adjust all subsequent parts
            if (insertCount > 0) {
                while (partIndex !== -1) {
                    parts[partIndex].index += insertCount;
                    partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
                }
                return;
            }
            partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
        }
    }
}
//# =modify-template.js.map

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// Get a key to lookup in `templateCaches`.
const getTemplateCacheKey = (type, scopeName) => `${type}--${scopeName}`;
let compatibleShadyCSSVersion = true;
if (typeof window.ShadyCSS === 'undefined') {
    compatibleShadyCSSVersion = false;
}
else if (typeof window.ShadyCSS.prepareTemplateDom === 'undefined') {
    console.warn(`Incompatible ShadyCSS version detected.` +
        `Please update to at least @webcomponents/webcomponentsjs@2.0.2 and` +
        `@webcomponents/shadycss@1.3.1.`);
    compatibleShadyCSSVersion = false;
}
/**
 * Template factory which scopes template DOM using ShadyCSS.
 * @param scopeName {string}
 */
const shadyTemplateFactory = (scopeName) => (result) => {
    const cacheKey = getTemplateCacheKey(result.type, scopeName);
    let templateCache = templateCaches.get(cacheKey);
    if (templateCache === undefined) {
        templateCache = {
            stringsArray: new WeakMap(),
            keyString: new Map()
        };
        templateCaches.set(cacheKey, templateCache);
    }
    let template = templateCache.stringsArray.get(result.strings);
    if (template !== undefined) {
        return template;
    }
    const key = result.strings.join(marker);
    template = templateCache.keyString.get(key);
    if (template === undefined) {
        const element = result.getTemplateElement();
        if (compatibleShadyCSSVersion) {
            window.ShadyCSS.prepareTemplateDom(element, scopeName);
        }
        template = new Template(result, element);
        templateCache.keyString.set(key, template);
    }
    templateCache.stringsArray.set(result.strings, template);
    return template;
};
const TEMPLATE_TYPES = ['html', 'svg'];
/**
 * Removes all style elements from Templates for the given scopeName.
 */
const removeStylesFromLitTemplates = (scopeName) => {
    TEMPLATE_TYPES.forEach((type) => {
        const templates = templateCaches.get(getTemplateCacheKey(type, scopeName));
        if (templates !== undefined) {
            templates.keyString.forEach((template) => {
                const { element: { content } } = template;
                // IE 11 doesn't support the iterable param Set constructor
                const styles = new Set();
                Array.from(content.querySelectorAll('style')).forEach((s) => {
                    styles.add(s);
                });
                removeNodesFromTemplate(template, styles);
            });
        }
    });
};
const shadyRenderSet = new Set();
/**
 * For the given scope name, ensures that ShadyCSS style scoping is performed.
 * This is done just once per scope name so the fragment and template cannot
 * be modified.
 * (1) extracts styles from the rendered fragment and hands them to ShadyCSS
 * to be scoped and appended to the document
 * (2) removes style elements from all lit-html Templates for this scope name.
 *
 * Note, <style> elements can only be placed into templates for the
 * initial rendering of the scope. If <style> elements are included in templates
 * dynamically rendered to the scope (after the first scope render), they will
 * not be scoped and the <style> will be left in the template and rendered
 * output.
 */
const prepareTemplateStyles = (renderedDOM, template, scopeName) => {
    shadyRenderSet.add(scopeName);
    // Move styles out of rendered DOM and store.
    const styles = renderedDOM.querySelectorAll('style');
    // If there are no styles, skip unnecessary work
    if (styles.length === 0) {
        // Ensure prepareTemplateStyles is called to support adding
        // styles via `prepareAdoptedCssText` since that requires that
        // `prepareTemplateStyles` is called.
        window.ShadyCSS.prepareTemplateStyles(template.element, scopeName);
        return;
    }
    const condensedStyle = document.createElement('style');
    // Collect styles into a single style. This helps us make sure ShadyCSS
    // manipulations will not prevent us from being able to fix up template
    // part indices.
    // NOTE: collecting styles is inefficient for browsers but ShadyCSS
    // currently does this anyway. When it does not, this should be changed.
    for (let i = 0; i < styles.length; i++) {
        const style = styles[i];
        style.parentNode.removeChild(style);
        condensedStyle.textContent += style.textContent;
    }
    // Remove styles from nested templates in this scope.
    removeStylesFromLitTemplates(scopeName);
    // And then put the condensed style into the "root" template passed in as
    // `template`.
    insertNodeIntoTemplate(template, condensedStyle, template.element.content.firstChild);
    // Note, it's important that ShadyCSS gets the template that `lit-html`
    // will actually render so that it can update the style inside when
    // needed (e.g. @apply native Shadow DOM case).
    window.ShadyCSS.prepareTemplateStyles(template.element, scopeName);
    if (window.ShadyCSS.nativeShadow) {
        // When in native Shadow DOM, re-add styling to rendered content using
        // the style ShadyCSS produced.
        const style = template.element.content.querySelector('style');
        renderedDOM.insertBefore(style.cloneNode(true), renderedDOM.firstChild);
    }
    else {
        // When not in native Shadow DOM, at this point ShadyCSS will have
        // removed the style from the lit template and parts will be broken as a
        // result. To fix this, we put back the style node ShadyCSS removed
        // and then tell lit to remove that node from the template.
        // NOTE, ShadyCSS creates its own style so we can safely add/remove
        // `condensedStyle` here.
        template.element.content.insertBefore(condensedStyle, template.element.content.firstChild);
        const removes = new Set();
        removes.add(condensedStyle);
        removeNodesFromTemplate(template, removes);
    }
};
/**
 * Extension to the standard `render` method which supports rendering
 * to ShadowRoots when the ShadyDOM (https://github.com/webcomponents/shadydom)
 * and ShadyCSS (https://github.com/webcomponents/shadycss) polyfills are used
 * or when the webcomponentsjs
 * (https://github.com/webcomponents/webcomponentsjs) polyfill is used.
 *
 * Adds a `scopeName` option which is used to scope element DOM and stylesheets
 * when native ShadowDOM is unavailable. The `scopeName` will be added to
 * the class attribute of all rendered DOM. In addition, any style elements will
 * be automatically re-written with this `scopeName` selector and moved out
 * of the rendered DOM and into the document `<head>`.
 *
 * It is common to use this render method in conjunction with a custom element
 * which renders a shadowRoot. When this is done, typically the element's
 * `localName` should be used as the `scopeName`.
 *
 * In addition to DOM scoping, ShadyCSS also supports a basic shim for css
 * custom properties (needed only on older browsers like IE11) and a shim for
 * a deprecated feature called `@apply` that supports applying a set of css
 * custom properties to a given location.
 *
 * Usage considerations:
 *
 * * Part values in `<style>` elements are only applied the first time a given
 * `scopeName` renders. Subsequent changes to parts in style elements will have
 * no effect. Because of this, parts in style elements should only be used for
 * values that will never change, for example parts that set scope-wide theme
 * values or parts which render shared style elements.
 *
 * * Note, due to a limitation of the ShadyDOM polyfill, rendering in a
 * custom element's `constructor` is not supported. Instead rendering should
 * either done asynchronously, for example at microtask timing (for example
 * `Promise.resolve()`), or be deferred until the first time the element's
 * `connectedCallback` runs.
 *
 * Usage considerations when using shimmed custom properties or `@apply`:
 *
 * * Whenever any dynamic changes are made which affect
 * css custom properties, `ShadyCSS.styleElement(element)` must be called
 * to update the element. There are two cases when this is needed:
 * (1) the element is connected to a new parent, (2) a class is added to the
 * element that causes it to match different custom properties.
 * To address the first case when rendering a custom element, `styleElement`
 * should be called in the element's `connectedCallback`.
 *
 * * Shimmed custom properties may only be defined either for an entire
 * shadowRoot (for example, in a `:host` rule) or via a rule that directly
 * matches an element with a shadowRoot. In other words, instead of flowing from
 * parent to child as do native css custom properties, shimmed custom properties
 * flow only from shadowRoots to nested shadowRoots.
 *
 * * When using `@apply` mixing css shorthand property names with
 * non-shorthand names (for example `border` and `border-width`) is not
 * supported.
 */
const render$1 = (result, container, options) => {
    const scopeName = options.scopeName;
    const hasRendered = parts.has(container);
    const needsScoping = container instanceof ShadowRoot &&
        compatibleShadyCSSVersion && result instanceof TemplateResult;
    // Handle first render to a scope specially...
    const firstScopeRender = needsScoping && !shadyRenderSet.has(scopeName);
    // On first scope render, render into a fragment; this cannot be a single
    // fragment that is reused since nested renders can occur synchronously.
    const renderContainer = firstScopeRender ? document.createDocumentFragment() : container;
    render(result, renderContainer, Object.assign({ templateFactory: shadyTemplateFactory(scopeName) }, options));
    // When performing first scope render,
    // (1) We've rendered into a fragment so that there's a chance to
    // `prepareTemplateStyles` before sub-elements hit the DOM
    // (which might cause them to render based on a common pattern of
    // rendering in a custom element's `connectedCallback`);
    // (2) Scope the template with ShadyCSS one time only for this scope.
    // (3) Render the fragment into the container and make sure the
    // container knows its `part` is the one we just rendered. This ensures
    // DOM will be re-used on subsequent renders.
    if (firstScopeRender) {
        const part = parts.get(renderContainer);
        parts.delete(renderContainer);
        if (part.value instanceof TemplateInstance) {
            prepareTemplateStyles(renderContainer, part.value.template, scopeName);
        }
        removeNodes(container, container.firstChild);
        container.appendChild(renderContainer);
        parts.set(container, part);
    }
    // After elements have hit the DOM, update styling if this is the
    // initial render to this container.
    // This is needed whenever dynamic changes are made so it would be
    // safest to do every render; however, this would regress performance
    // so we leave it up to the user to call `ShadyCSSS.styleElement`
    // for dynamic changes.
    if (!hasRendered && needsScoping) {
        window.ShadyCSS.styleElement(container.host);
    }
};
//# =shady-render.js.map

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * When using Closure Compiler, JSCompiler_renameProperty(property, object) is
 * replaced at compile time by the munged name for object[property]. We cannot
 * alias this function, so we have to use a small shim that has the same
 * behavior when not compiling.
 */
window.JSCompiler_renameProperty =
    (prop, _obj) => prop;
const defaultConverter = {
    toAttribute(value, type) {
        switch (type) {
            case Boolean:
                return value ? '' : null;
            case Object:
            case Array:
                // if the value is `null` or `undefined` pass this through
                // to allow removing/no change behavior.
                return value == null ? value : JSON.stringify(value);
        }
        return value;
    },
    fromAttribute(value, type) {
        switch (type) {
            case Boolean:
                return value !== null;
            case Number:
                return value === null ? null : Number(value);
            case Object:
            case Array:
                return JSON.parse(value);
        }
        return value;
    }
};
/**
 * Change function that returns true if `value` is different from `oldValue`.
 * This method is used as the default for a property's `hasChanged` function.
 */
const notEqual = (value, old) => {
    // This ensures (old==NaN, value==NaN) always returns false
    return old !== value && (old === old || value === value);
};
const defaultPropertyDeclaration = {
    attribute: true,
    type: String,
    converter: defaultConverter,
    reflect: false,
    hasChanged: notEqual
};
const microtaskPromise = Promise.resolve(true);
const STATE_HAS_UPDATED = 1;
const STATE_UPDATE_REQUESTED = 1 << 2;
const STATE_IS_REFLECTING_TO_ATTRIBUTE = 1 << 3;
const STATE_IS_REFLECTING_TO_PROPERTY = 1 << 4;
const STATE_HAS_CONNECTED = 1 << 5;
/**
 * Base element class which manages element properties and attributes. When
 * properties change, the `update` method is asynchronously called. This method
 * should be supplied by subclassers to render updates as desired.
 */
class UpdatingElement extends HTMLElement {
    constructor() {
        super();
        this._updateState = 0;
        this._instanceProperties = undefined;
        this._updatePromise = microtaskPromise;
        this._hasConnectedResolver = undefined;
        /**
         * Map with keys for any properties that have changed since the last
         * update cycle with previous values.
         */
        this._changedProperties = new Map();
        /**
         * Map with keys of properties that should be reflected when updated.
         */
        this._reflectingProperties = undefined;
        this.initialize();
    }
    /**
     * Returns a list of attributes corresponding to the registered properties.
     * @nocollapse
     */
    static get observedAttributes() {
        // note: piggy backing on this to ensure we're finalized.
        this.finalize();
        const attributes = [];
        // Use forEach so this works even if for/of loops are compiled to for loops
        // expecting arrays
        this._classProperties.forEach((v, p) => {
            const attr = this._attributeNameForProperty(p, v);
            if (attr !== undefined) {
                this._attributeToPropertyMap.set(attr, p);
                attributes.push(attr);
            }
        });
        return attributes;
    }
    /**
     * Ensures the private `_classProperties` property metadata is created.
     * In addition to `finalize` this is also called in `createProperty` to
     * ensure the `@property` decorator can add property metadata.
     */
    /** @nocollapse */
    static _ensureClassProperties() {
        // ensure private storage for property declarations.
        if (!this.hasOwnProperty(JSCompiler_renameProperty('_classProperties', this))) {
            this._classProperties = new Map();
            // NOTE: Workaround IE11 not supporting Map constructor argument.
            const superProperties = Object.getPrototypeOf(this)._classProperties;
            if (superProperties !== undefined) {
                superProperties.forEach((v, k) => this._classProperties.set(k, v));
            }
        }
    }
    /**
     * Creates a property accessor on the element prototype if one does not exist.
     * The property setter calls the property's `hasChanged` property option
     * or uses a strict identity check to determine whether or not to request
     * an update.
     * @nocollapse
     */
    static createProperty(name, options = defaultPropertyDeclaration) {
        // Note, since this can be called by the `@property` decorator which
        // is called before `finalize`, we ensure storage exists for property
        // metadata.
        this._ensureClassProperties();
        this._classProperties.set(name, options);
        // Do not generate an accessor if the prototype already has one, since
        // it would be lost otherwise and that would never be the user's intention;
        // Instead, we expect users to call `requestUpdate` themselves from
        // user-defined accessors. Note that if the super has an accessor we will
        // still overwrite it
        if (options.noAccessor || this.prototype.hasOwnProperty(name)) {
            return;
        }
        const key = typeof name === 'symbol' ? Symbol() : `__${name}`;
        Object.defineProperty(this.prototype, name, {
            // tslint:disable-next-line:no-any no symbol in index
            get() {
                // tslint:disable-next-line:no-any no symbol in index
                return this[key];
            },
            set(value) {
                // tslint:disable-next-line:no-any no symbol in index
                const oldValue = this[name];
                // tslint:disable-next-line:no-any no symbol in index
                this[key] = value;
                this.requestUpdate(name, oldValue);
            },
            configurable: true,
            enumerable: true
        });
    }
    /**
     * Creates property accessors for registered properties and ensures
     * any superclasses are also finalized.
     * @nocollapse
     */
    static finalize() {
        if (this.hasOwnProperty(JSCompiler_renameProperty('finalized', this)) &&
            this.finalized) {
            return;
        }
        // finalize any superclasses
        const superCtor = Object.getPrototypeOf(this);
        if (typeof superCtor.finalize === 'function') {
            superCtor.finalize();
        }
        this.finalized = true;
        this._ensureClassProperties();
        // initialize Map populated in observedAttributes
        this._attributeToPropertyMap = new Map();
        // make any properties
        // Note, only process "own" properties since this element will inherit
        // any properties defined on the superClass, and finalization ensures
        // the entire prototype chain is finalized.
        if (this.hasOwnProperty(JSCompiler_renameProperty('properties', this))) {
            const props = this.properties;
            // support symbols in properties (IE11 does not support this)
            const propKeys = [
                ...Object.getOwnPropertyNames(props),
                ...(typeof Object.getOwnPropertySymbols === 'function') ?
                    Object.getOwnPropertySymbols(props) :
                    []
            ];
            // This for/of is ok because propKeys is an array
            for (const p of propKeys) {
                // note, use of `any` is due to TypeSript lack of support for symbol in
                // index types
                // tslint:disable-next-line:no-any no symbol in index
                this.createProperty(p, props[p]);
            }
        }
    }
    /**
     * Returns the property name for the given attribute `name`.
     * @nocollapse
     */
    static _attributeNameForProperty(name, options) {
        const attribute = options.attribute;
        return attribute === false ?
            undefined :
            (typeof attribute === 'string' ?
                attribute :
                (typeof name === 'string' ? name.toLowerCase() : undefined));
    }
    /**
     * Returns true if a property should request an update.
     * Called when a property value is set and uses the `hasChanged`
     * option for the property if present or a strict identity check.
     * @nocollapse
     */
    static _valueHasChanged(value, old, hasChanged = notEqual) {
        return hasChanged(value, old);
    }
    /**
     * Returns the property value for the given attribute value.
     * Called via the `attributeChangedCallback` and uses the property's
     * `converter` or `converter.fromAttribute` property option.
     * @nocollapse
     */
    static _propertyValueFromAttribute(value, options) {
        const type = options.type;
        const converter = options.converter || defaultConverter;
        const fromAttribute = (typeof converter === 'function' ? converter : converter.fromAttribute);
        return fromAttribute ? fromAttribute(value, type) : value;
    }
    /**
     * Returns the attribute value for the given property value. If this
     * returns undefined, the property will *not* be reflected to an attribute.
     * If this returns null, the attribute will be removed, otherwise the
     * attribute will be set to the value.
     * This uses the property's `reflect` and `type.toAttribute` property options.
     * @nocollapse
     */
    static _propertyValueToAttribute(value, options) {
        if (options.reflect === undefined) {
            return;
        }
        const type = options.type;
        const converter = options.converter;
        const toAttribute = converter && converter.toAttribute ||
            defaultConverter.toAttribute;
        return toAttribute(value, type);
    }
    /**
     * Performs element initialization. By default captures any pre-set values for
     * registered properties.
     */
    initialize() {
        this._saveInstanceProperties();
    }
    /**
     * Fixes any properties set on the instance before upgrade time.
     * Otherwise these would shadow the accessor and break these properties.
     * The properties are stored in a Map which is played back after the
     * constructor runs. Note, on very old versions of Safari (<=9) or Chrome
     * (<=41), properties created for native platform properties like (`id` or
     * `name`) may not have default values set in the element constructor. On
     * these browsers native properties appear on instances and therefore their
     * default value will overwrite any element default (e.g. if the element sets
     * this.id = 'id' in the constructor, the 'id' will become '' since this is
     * the native platform default).
     */
    _saveInstanceProperties() {
        // Use forEach so this works even if for/of loops are compiled to for loops
        // expecting arrays
        this.constructor
            ._classProperties.forEach((_v, p) => {
            if (this.hasOwnProperty(p)) {
                const value = this[p];
                delete this[p];
                if (!this._instanceProperties) {
                    this._instanceProperties = new Map();
                }
                this._instanceProperties.set(p, value);
            }
        });
    }
    /**
     * Applies previously saved instance properties.
     */
    _applyInstanceProperties() {
        // Use forEach so this works even if for/of loops are compiled to for loops
        // expecting arrays
        // tslint:disable-next-line:no-any
        this._instanceProperties.forEach((v, p) => this[p] = v);
        this._instanceProperties = undefined;
    }
    connectedCallback() {
        this._updateState = this._updateState | STATE_HAS_CONNECTED;
        // Ensure connection triggers an update. Updates cannot complete before
        // connection and if one is pending connection the `_hasConnectionResolver`
        // will exist. If so, resolve it to complete the update, otherwise
        // requestUpdate.
        if (this._hasConnectedResolver) {
            this._hasConnectedResolver();
            this._hasConnectedResolver = undefined;
        }
        else {
            this.requestUpdate();
        }
    }
    /**
     * Allows for `super.disconnectedCallback()` in extensions while
     * reserving the possibility of making non-breaking feature additions
     * when disconnecting at some point in the future.
     */
    disconnectedCallback() {
    }
    /**
     * Synchronizes property values when attributes change.
     */
    attributeChangedCallback(name, old, value) {
        if (old !== value) {
            this._attributeToProperty(name, value);
        }
    }
    _propertyToAttribute(name, value, options = defaultPropertyDeclaration) {
        const ctor = this.constructor;
        const attr = ctor._attributeNameForProperty(name, options);
        if (attr !== undefined) {
            const attrValue = ctor._propertyValueToAttribute(value, options);
            // an undefined value does not change the attribute.
            if (attrValue === undefined) {
                return;
            }
            // Track if the property is being reflected to avoid
            // setting the property again via `attributeChangedCallback`. Note:
            // 1. this takes advantage of the fact that the callback is synchronous.
            // 2. will behave incorrectly if multiple attributes are in the reaction
            // stack at time of calling. However, since we process attributes
            // in `update` this should not be possible (or an extreme corner case
            // that we'd like to discover).
            // mark state reflecting
            this._updateState = this._updateState | STATE_IS_REFLECTING_TO_ATTRIBUTE;
            if (attrValue == null) {
                this.removeAttribute(attr);
            }
            else {
                this.setAttribute(attr, attrValue);
            }
            // mark state not reflecting
            this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_ATTRIBUTE;
        }
    }
    _attributeToProperty(name, value) {
        // Use tracking info to avoid deserializing attribute value if it was
        // just set from a property setter.
        if (this._updateState & STATE_IS_REFLECTING_TO_ATTRIBUTE) {
            return;
        }
        const ctor = this.constructor;
        const propName = ctor._attributeToPropertyMap.get(name);
        if (propName !== undefined) {
            const options = ctor._classProperties.get(propName) || defaultPropertyDeclaration;
            // mark state reflecting
            this._updateState = this._updateState | STATE_IS_REFLECTING_TO_PROPERTY;
            this[propName] =
                // tslint:disable-next-line:no-any
                ctor._propertyValueFromAttribute(value, options);
            // mark state not reflecting
            this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_PROPERTY;
        }
    }
    /**
     * Requests an update which is processed asynchronously. This should
     * be called when an element should update based on some state not triggered
     * by setting a property. In this case, pass no arguments. It should also be
     * called when manually implementing a property setter. In this case, pass the
     * property `name` and `oldValue` to ensure that any configured property
     * options are honored. Returns the `updateComplete` Promise which is resolved
     * when the update completes.
     *
     * @param name {PropertyKey} (optional) name of requesting property
     * @param oldValue {any} (optional) old value of requesting property
     * @returns {Promise} A Promise that is resolved when the update completes.
     */
    requestUpdate(name, oldValue) {
        let shouldRequestUpdate = true;
        // if we have a property key, perform property update steps.
        if (name !== undefined && !this._changedProperties.has(name)) {
            const ctor = this.constructor;
            const options = ctor._classProperties.get(name) || defaultPropertyDeclaration;
            if (ctor._valueHasChanged(this[name], oldValue, options.hasChanged)) {
                // track old value when changing.
                this._changedProperties.set(name, oldValue);
                // add to reflecting properties set
                if (options.reflect === true &&
                    !(this._updateState & STATE_IS_REFLECTING_TO_PROPERTY)) {
                    if (this._reflectingProperties === undefined) {
                        this._reflectingProperties = new Map();
                    }
                    this._reflectingProperties.set(name, options);
                }
                // abort the request if the property should not be considered changed.
            }
            else {
                shouldRequestUpdate = false;
            }
        }
        if (!this._hasRequestedUpdate && shouldRequestUpdate) {
            this._enqueueUpdate();
        }
        return this.updateComplete;
    }
    /**
     * Sets up the element to asynchronously update.
     */
    async _enqueueUpdate() {
        // Mark state updating...
        this._updateState = this._updateState | STATE_UPDATE_REQUESTED;
        let resolve;
        const previousUpdatePromise = this._updatePromise;
        this._updatePromise = new Promise((res) => resolve = res);
        // Ensure any previous update has resolved before updating.
        // This `await` also ensures that property changes are batched.
        await previousUpdatePromise;
        // Make sure the element has connected before updating.
        if (!this._hasConnected) {
            await new Promise((res) => this._hasConnectedResolver = res);
        }
        // Allow `performUpdate` to be asynchronous to enable scheduling of updates.
        const result = this.performUpdate();
        // Note, this is to avoid delaying an additional microtask unless we need
        // to.
        if (result != null &&
            typeof result.then === 'function') {
            await result;
        }
        resolve(!this._hasRequestedUpdate);
    }
    get _hasConnected() {
        return (this._updateState & STATE_HAS_CONNECTED);
    }
    get _hasRequestedUpdate() {
        return (this._updateState & STATE_UPDATE_REQUESTED);
    }
    get hasUpdated() {
        return (this._updateState & STATE_HAS_UPDATED);
    }
    /**
     * Performs an element update.
     *
     * You can override this method to change the timing of updates. For instance,
     * to schedule updates to occur just before the next frame:
     *
     * ```
     * protected async performUpdate(): Promise<unknown> {
     *   await new Promise((resolve) => requestAnimationFrame(() => resolve()));
     *   super.performUpdate();
     * }
     * ```
     */
    performUpdate() {
        // Mixin instance properties once, if they exist.
        if (this._instanceProperties) {
            this._applyInstanceProperties();
        }
        if (this.shouldUpdate(this._changedProperties)) {
            const changedProperties = this._changedProperties;
            this.update(changedProperties);
            this._markUpdated();
            if (!(this._updateState & STATE_HAS_UPDATED)) {
                this._updateState = this._updateState | STATE_HAS_UPDATED;
                this.firstUpdated(changedProperties);
            }
            this.updated(changedProperties);
        }
        else {
            this._markUpdated();
        }
    }
    _markUpdated() {
        this._changedProperties = new Map();
        this._updateState = this._updateState & ~STATE_UPDATE_REQUESTED;
    }
    /**
     * Returns a Promise that resolves when the element has completed updating.
     * The Promise value is a boolean that is `true` if the element completed the
     * update without triggering another update. The Promise result is `false` if
     * a property was set inside `updated()`. This getter can be implemented to
     * await additional state. For example, it is sometimes useful to await a
     * rendered element before fulfilling this Promise. To do this, first await
     * `super.updateComplete` then any subsequent state.
     *
     * @returns {Promise} The Promise returns a boolean that indicates if the
     * update resolved without triggering another update.
     */
    get updateComplete() {
        return this._updatePromise;
    }
    /**
     * Controls whether or not `update` should be called when the element requests
     * an update. By default, this method always returns `true`, but this can be
     * customized to control when to update.
     *
     * * @param _changedProperties Map of changed properties with old values
     */
    shouldUpdate(_changedProperties) {
        return true;
    }
    /**
     * Updates the element. This method reflects property values to attributes.
     * It can be overridden to render and keep updated element DOM.
     * Setting properties inside this method will *not* trigger
     * another update.
     *
     * * @param _changedProperties Map of changed properties with old values
     */
    update(_changedProperties) {
        if (this._reflectingProperties !== undefined &&
            this._reflectingProperties.size > 0) {
            // Use forEach so this works even if for/of loops are compiled to for
            // loops expecting arrays
            this._reflectingProperties.forEach((v, k) => this._propertyToAttribute(k, this[k], v));
            this._reflectingProperties = undefined;
        }
    }
    /**
     * Invoked whenever the element is updated. Implement to perform
     * post-updating tasks via DOM APIs, for example, focusing an element.
     *
     * Setting properties inside this method will trigger the element to update
     * again after this update cycle completes.
     *
     * * @param _changedProperties Map of changed properties with old values
     */
    updated(_changedProperties) {
    }
    /**
     * Invoked when the element is first updated. Implement to perform one time
     * work on the element after update.
     *
     * Setting properties inside this method will trigger the element to update
     * again after this update cycle completes.
     *
     * * @param _changedProperties Map of changed properties with old values
     */
    firstUpdated(_changedProperties) {
    }
}
/**
 * Marks class as having finished creating properties.
 */
UpdatingElement.finalized = true;
//# =updating-element.js.map

/**
@license
Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/
const supportsAdoptingStyleSheets = ('adoptedStyleSheets' in Document.prototype) &&
    ('replace' in CSSStyleSheet.prototype);
const constructionToken = Symbol();
class CSSResult {
    constructor(cssText, safeToken) {
        if (safeToken !== constructionToken) {
            throw new Error('CSSResult is not constructable. Use `unsafeCSS` or `css` instead.');
        }
        this.cssText = cssText;
    }
    // Note, this is a getter so that it's lazy. In practice, this means
    // stylesheets are not created until the first element instance is made.
    get styleSheet() {
        if (this._styleSheet === undefined) {
            // Note, if `adoptedStyleSheets` is supported then we assume CSSStyleSheet
            // is constructable.
            if (supportsAdoptingStyleSheets) {
                this._styleSheet = new CSSStyleSheet();
                this._styleSheet.replaceSync(this.cssText);
            }
            else {
                this._styleSheet = null;
            }
        }
        return this._styleSheet;
    }
    toString() {
        return this.cssText;
    }
}
const textFromCSSResult = (value) => {
    if (value instanceof CSSResult) {
        return value.cssText;
    }
    else {
        throw new Error(`Value passed to 'css' function must be a 'css' function result: ${value}. Use 'unsafeCSS' to pass non-literal values, but
            take care to ensure page security.`);
    }
};
/**
 * Template tag which which can be used with LitElement's `style` property to
 * set element styles. For security reasons, only literal string values may be
 * used. To incorporate non-literal values `unsafeCSS` may be used inside a
 * template string part.
 */
const css = (strings, ...values) => {
    const cssText = values.reduce((acc, v, idx) => acc + textFromCSSResult(v) + strings[idx + 1], strings[0]);
    return new CSSResult(cssText, constructionToken);
};
//# =css-tag.js.map

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for LitElement usage.
// TODO(justinfagnani): inject version number at build time
(window['litElementVersions'] || (window['litElementVersions'] = []))
    .push('2.0.1');
/**
 * Minimal implementation of Array.prototype.flat
 * @param arr the array to flatten
 * @param result the accumlated result
 */
function arrayFlat(styles, result = []) {
    for (let i = 0, length = styles.length; i < length; i++) {
        const value = styles[i];
        if (Array.isArray(value)) {
            arrayFlat(value, result);
        }
        else {
            result.push(value);
        }
    }
    return result;
}
/** Deeply flattens styles array. Uses native flat if available. */
const flattenStyles = (styles) => styles.flat ? styles.flat(Infinity) : arrayFlat(styles);
class LitElement extends UpdatingElement {
    /** @nocollapse */
    static finalize() {
        super.finalize();
        // Prepare styling that is stamped at first render time. Styling
        // is built from user provided `styles` or is inherited from the superclass.
        this._styles =
            this.hasOwnProperty(JSCompiler_renameProperty('styles', this)) ?
                this._getUniqueStyles() :
                this._styles || [];
    }
    /** @nocollapse */
    static _getUniqueStyles() {
        // Take care not to call `this.styles` multiple times since this generates
        // new CSSResults each time.
        // TODO(sorvell): Since we do not cache CSSResults by input, any
        // shared styles will generate new stylesheet objects, which is wasteful.
        // This should be addressed when a browser ships constructable
        // stylesheets.
        const userStyles = this.styles;
        const styles = [];
        if (Array.isArray(userStyles)) {
            const flatStyles = flattenStyles(userStyles);
            // As a performance optimization to avoid duplicated styling that can
            // occur especially when composing via subclassing, de-duplicate styles
            // preserving the last item in the list. The last item is kept to
            // try to preserve cascade order with the assumption that it's most
            // important that last added styles override previous styles.
            const styleSet = flatStyles.reduceRight((set, s) => {
                set.add(s);
                // on IE set.add does not return the set.
                return set;
            }, new Set());
            // Array.from does not work on Set in IE
            styleSet.forEach((v) => styles.unshift(v));
        }
        else if (userStyles) {
            styles.push(userStyles);
        }
        return styles;
    }
    /**
     * Performs element initialization. By default this calls `createRenderRoot`
     * to create the element `renderRoot` node and captures any pre-set values for
     * registered properties.
     */
    initialize() {
        super.initialize();
        this.renderRoot = this.createRenderRoot();
        // Note, if renderRoot is not a shadowRoot, styles would/could apply to the
        // element's getRootNode(). While this could be done, we're choosing not to
        // support this now since it would require different logic around de-duping.
        if (window.ShadowRoot && this.renderRoot instanceof window.ShadowRoot) {
            this.adoptStyles();
        }
    }
    /**
     * Returns the node into which the element should render and by default
     * creates and returns an open shadowRoot. Implement to customize where the
     * element's DOM is rendered. For example, to render into the element's
     * childNodes, return `this`.
     * @returns {Element|DocumentFragment} Returns a node into which to render.
     */
    createRenderRoot() {
        return this.attachShadow({ mode: 'open' });
    }
    /**
     * Applies styling to the element shadowRoot using the `static get styles`
     * property. Styling will apply using `shadowRoot.adoptedStyleSheets` where
     * available and will fallback otherwise. When Shadow DOM is polyfilled,
     * ShadyCSS scopes styles and adds them to the document. When Shadow DOM
     * is available but `adoptedStyleSheets` is not, styles are appended to the
     * end of the `shadowRoot` to [mimic spec
     * behavior](https://wicg.github.io/construct-stylesheets/#using-constructed-stylesheets).
     */
    adoptStyles() {
        const styles = this.constructor._styles;
        if (styles.length === 0) {
            return;
        }
        // There are three separate cases here based on Shadow DOM support.
        // (1) shadowRoot polyfilled: use ShadyCSS
        // (2) shadowRoot.adoptedStyleSheets available: use it.
        // (3) shadowRoot.adoptedStyleSheets polyfilled: append styles after
        // rendering
        if (window.ShadyCSS !== undefined && !window.ShadyCSS.nativeShadow) {
            window.ShadyCSS.ScopingShim.prepareAdoptedCssText(styles.map((s) => s.cssText), this.localName);
        }
        else if (supportsAdoptingStyleSheets) {
            this.renderRoot.adoptedStyleSheets =
                styles.map((s) => s.styleSheet);
        }
        else {
            // This must be done after rendering so the actual style insertion is done
            // in `update`.
            this._needsShimAdoptedStyleSheets = true;
        }
    }
    connectedCallback() {
        super.connectedCallback();
        // Note, first update/render handles styleElement so we only call this if
        // connected after first update.
        if (this.hasUpdated && window.ShadyCSS !== undefined) {
            window.ShadyCSS.styleElement(this);
        }
    }
    /**
     * Updates the element. This method reflects property values to attributes
     * and calls `render` to render DOM via lit-html. Setting properties inside
     * this method will *not* trigger another update.
     * * @param _changedProperties Map of changed properties with old values
     */
    update(changedProperties) {
        super.update(changedProperties);
        const templateResult = this.render();
        if (templateResult instanceof TemplateResult) {
            this.constructor
                .render(templateResult, this.renderRoot, { scopeName: this.localName, eventContext: this });
        }
        // When native Shadow DOM is used but adoptedStyles are not supported,
        // insert styling after rendering to ensure adoptedStyles have highest
        // priority.
        if (this._needsShimAdoptedStyleSheets) {
            this._needsShimAdoptedStyleSheets = false;
            this.constructor._styles.forEach((s) => {
                const style = document.createElement('style');
                style.textContent = s.cssText;
                this.renderRoot.appendChild(style);
            });
        }
    }
    /**
     * Invoked on each update to perform rendering tasks. This method must return
     * a lit-html TemplateResult. Setting properties inside this method will *not*
     * trigger the element to update.
     */
    render() {
    }
}
/**
 * Ensure this class is marked as `finalized` as an optimization ensuring
 * it will not needlessly try to `finalize`.
 */
LitElement.finalized = true;
/**
 * Render method used to render the lit-html TemplateResult to the element's
 * DOM.
 * @param {TemplateResult} Template to render.
 * @param {Element|DocumentFragment} Node into which to render.
 * @param {String} Element name.
 * @nocollapse
 */
LitElement.render = render$1;

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// Helper functions for manipulating parts
// TODO(kschaaf): Refactor into Part API?
const createAndInsertPart = (containerPart, beforePart) => {
    const container = containerPart.startNode.parentNode;
    const beforeNode = beforePart === undefined ? containerPart.endNode :
        beforePart.startNode;
    const startNode = container.insertBefore(createMarker(), beforeNode);
    container.insertBefore(createMarker(), beforeNode);
    const newPart = new NodePart(containerPart.options);
    newPart.insertAfterNode(startNode);
    return newPart;
};
const updatePart = (part, value) => {
    part.setValue(value);
    part.commit();
    return part;
};
const insertPartBefore = (containerPart, part, ref) => {
    const container = containerPart.startNode.parentNode;
    const beforeNode = ref ? ref.startNode : containerPart.endNode;
    const endNode = part.endNode.nextSibling;
    if (endNode !== beforeNode) {
        reparentNodes(container, part.startNode, endNode, beforeNode);
    }
};
const removePart = (part) => {
    removeNodes(part.startNode.parentNode, part.startNode, part.endNode.nextSibling);
};
// Helper for generating a map of array item to its index over a subset
// of an array (used to lazily generate `newKeyToIndexMap` and
// `oldKeyToIndexMap`)
const generateMap = (list, start, end) => {
    const map = new Map();
    for (let i = start; i <= end; i++) {
        map.set(list[i], i);
    }
    return map;
};
// Stores previous ordered list of parts and map of key to index
const partListCache = new WeakMap();
const keyListCache = new WeakMap();
/**
 * A directive that repeats a series of values (usually `TemplateResults`)
 * generated from an iterable, and updates those items efficiently when the
 * iterable changes based on user-provided `keys` associated with each item.
 *
 * Note that if a `keyFn` is provided, strict key-to-DOM mapping is maintained,
 * meaning previous DOM for a given key is moved into the new position if
 * needed, and DOM will never be reused with values for different keys (new DOM
 * will always be created for new keys). This is generally the most efficient
 * way to use `repeat` since it performs minimum unnecessary work for insertions
 * amd removals.
 *
 * IMPORTANT: If providing a `keyFn`, keys *must* be unique for all items in a
 * given call to `repeat`. The behavior when two or more items have the same key
 * is undefined.
 *
 * If no `keyFn` is provided, this directive will perform similar to mapping
 * items to values, and DOM will be reused against potentially different items.
 */
const repeat = directive((items, keyFnOrTemplate, template) => {
    let keyFn;
    if (template === undefined) {
        template = keyFnOrTemplate;
    }
    else if (keyFnOrTemplate !== undefined) {
        keyFn = keyFnOrTemplate;
    }
    return (containerPart) => {
        if (!(containerPart instanceof NodePart)) {
            throw new Error('repeat can only be used in text bindings');
        }
        // Old part & key lists are retrieved from the last update
        // (associated with the part for this instance of the directive)
        const oldParts = partListCache.get(containerPart) || [];
        const oldKeys = keyListCache.get(containerPart) || [];
        // New part list will be built up as we go (either reused from
        // old parts or created for new keys in this update). This is
        // saved in the above cache at the end of the update.
        const newParts = [];
        // New value list is eagerly generated from items along with a
        // parallel array indicating its key.
        const newValues = [];
        const newKeys = [];
        let index = 0;
        for (const item of items) {
            newKeys[index] = keyFn ? keyFn(item, index) : index;
            newValues[index] = template(item, index);
            index++;
        }
        // Maps from key to index for current and previous update; these
        // are generated lazily only when needed as a performance
        // optimization, since they are only required for multiple
        // non-contiguous changes in the list, which are less common.
        let newKeyToIndexMap;
        let oldKeyToIndexMap;
        // Head and tail pointers to old parts and new values
        let oldHead = 0;
        let oldTail = oldParts.length - 1;
        let newHead = 0;
        let newTail = newValues.length - 1;
        // Overview of O(n) reconciliation algorithm (general approach
        // based on ideas found in ivi, vue, snabbdom, etc.):
        //
        // * We start with the list of old parts and new values (and
        // arrays of
        //   their respective keys), head/tail pointers into each, and
        //   we build up the new list of parts by updating (and when
        //   needed, moving) old parts or creating new ones. The initial
        //   scenario might look like this (for brevity of the diagrams,
        //   the numbers in the array reflect keys associated with the
        //   old parts or new values, although keys and parts/values are
        //   actually stored in parallel arrays indexed using the same
        //   head/tail pointers):
        //
        //      oldHead v                 v oldTail
        //   oldKeys:  [0, 1, 2, 3, 4, 5, 6]
        //   newParts: [ ,  ,  ,  ,  ,  ,  ]
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6] <- reflects the user's new
        //   item order
        //      newHead ^                 ^ newTail
        //
        // * Iterate old & new lists from both sides, updating,
        // swapping, or
        //   removing parts at the head/tail locations until neither
        //   head nor tail can move.
        //
        // * Example below: keys at head pointers match, so update old
        // part 0 in-
        //   place (no need to move it) and record part 0 in the
        //   `newParts` list. The last thing we do is advance the
        //   `oldHead` and `newHead` pointers (will be reflected in the
        //   next diagram).
        //
        //      oldHead v                 v oldTail
        //   oldKeys:  [0, 1, 2, 3, 4, 5, 6]
        //   newParts: [0,  ,  ,  ,  ,  ,  ] <- heads matched: update 0
        //   and newKeys:  [0, 2, 1, 4, 3, 7, 6]    advance both oldHead
        //   & newHead
        //      newHead ^                 ^ newTail
        //
        // * Example below: head pointers don't match, but tail pointers
        // do, so
        //   update part 6 in place (no need to move it), and record
        //   part 6 in the `newParts` list. Last, advance the `oldTail`
        //   and `oldHead` pointers.
        //
        //         oldHead v              v oldTail
        //   oldKeys:  [0, 1, 2, 3, 4, 5, 6]
        //   newParts: [0,  ,  ,  ,  ,  , 6] <- tails matched: update 6
        //   and newKeys:  [0, 2, 1, 4, 3, 7, 6]    advance both oldTail
        //   & newTail
        //         newHead ^              ^ newTail
        //
        // * If neither head nor tail match; next check if one of the
        // old head/tail
        //   items was removed. We first need to generate the reverse
        //   map of new keys to index (`newKeyToIndexMap`), which is
        //   done once lazily as a performance optimization, since we
        //   only hit this case if multiple non-contiguous changes were
        //   made. Note that for contiguous removal anywhere in the
        //   list, the head and tails would advance from either end and
        //   pass each other before we get to this case and removals
        //   would be handled in the final while loop without needing to
        //   generate the map.
        //
        // * Example below: The key at `oldTail` was removed (no longer
        // in the
        //   `newKeyToIndexMap`), so remove that part from the DOM and
        //   advance just the `oldTail` pointer.
        //
        //         oldHead v           v oldTail
        //   oldKeys:  [0, 1, 2, 3, 4, 5, 6]
        //   newParts: [0,  ,  ,  ,  ,  , 6] <- 5 not in new map; remove
        //   5 and newKeys:  [0, 2, 1, 4, 3, 7, 6]    advance oldTail
        //         newHead ^           ^ newTail
        //
        // * Once head and tail cannot move, any mismatches are due to
        // either new or
        //   moved items; if a new key is in the previous "old key to
        //   old index" map, move the old part to the new location,
        //   otherwise create and insert a new part. Note that when
        //   moving an old part we null its position in the oldParts
        //   array if it lies between the head and tail so we know to
        //   skip it when the pointers get there.
        //
        // * Example below: neither head nor tail match, and neither
        // were removed;
        //   so find the `newHead` key in the `oldKeyToIndexMap`, and
        //   move that old part's DOM into the next head position
        //   (before `oldParts[oldHead]`). Last, null the part in the
        //   `oldPart` array since it was somewhere in the remaining
        //   oldParts still to be scanned (between the head and tail
        //   pointers) so that we know to skip that old part on future
        //   iterations.
        //
        //         oldHead v        v oldTail
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
        //   newParts: [0, 2,  ,  ,  ,  , 6] <- stuck; update & move 2
        //   into place newKeys:  [0, 2, 1, 4, 3, 7, 6]    and advance
        //   newHead
        //         newHead ^           ^ newTail
        //
        // * Note that for moves/insertions like the one above, a part
        // inserted at
        //   the head pointer is inserted before the current
        //   `oldParts[oldHead]`, and a part inserted at the tail
        //   pointer is inserted before `newParts[newTail+1]`. The
        //   seeming asymmetry lies in the fact that new parts are moved
        //   into place outside in, so to the right of the head pointer
        //   are old parts, and to the right of the tail pointer are new
        //   parts.
        //
        // * We always restart back from the top of the algorithm,
        // allowing matching
        //   and simple updates in place to continue...
        //
        // * Example below: the head pointers once again match, so
        // simply update
        //   part 1 and record it in the `newParts` array.  Last,
        //   advance both head pointers.
        //
        //         oldHead v        v oldTail
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
        //   newParts: [0, 2, 1,  ,  ,  , 6] <- heads matched; update 1
        //   and newKeys:  [0, 2, 1, 4, 3, 7, 6]    advance both oldHead
        //   & newHead
        //            newHead ^        ^ newTail
        //
        // * As mentioned above, items that were moved as a result of
        // being stuck
        //   (the final else clause in the code below) are marked with
        //   null, so we always advance old pointers over these so we're
        //   comparing the next actual old value on either end.
        //
        // * Example below: `oldHead` is null (already placed in
        // newParts), so
        //   advance `oldHead`.
        //
        //            oldHead v     v oldTail
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6] // old head already used;
        //   advance newParts: [0, 2, 1,  ,  ,  , 6] // oldHead newKeys:
        //   [0, 2, 1, 4, 3, 7, 6]
        //               newHead ^     ^ newTail
        //
        // * Note it's not critical to mark old parts as null when they
        // are moved
        //   from head to tail or tail to head, since they will be
        //   outside the pointer range and never visited again.
        //
        // * Example below: Here the old tail key matches the new head
        // key, so
        //   the part at the `oldTail` position and move its DOM to the
        //   new head position (before `oldParts[oldHead]`). Last,
        //   advance `oldTail` and `newHead` pointers.
        //
        //               oldHead v  v oldTail
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
        //   newParts: [0, 2, 1, 4,  ,  , 6] <- old tail matches new
        //   head: update newKeys:  [0, 2, 1, 4, 3, 7, 6]   & move 4,
        //   advance oldTail & newHead
        //               newHead ^     ^ newTail
        //
        // * Example below: Old and new head keys match, so update the
        // old head
        //   part in place, and advance the `oldHead` and `newHead`
        //   pointers.
        //
        //               oldHead v oldTail
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
        //   newParts: [0, 2, 1, 4, 3,   ,6] <- heads match: update 3
        //   and advance newKeys:  [0, 2, 1, 4, 3, 7, 6]    oldHead &
        //   newHead
        //                  newHead ^  ^ newTail
        //
        // * Once the new or old pointers move past each other then all
        // we have
        //   left is additions (if old list exhausted) or removals (if
        //   new list exhausted). Those are handled in the final while
        //   loops at the end.
        //
        // * Example below: `oldHead` exceeded `oldTail`, so we're done
        // with the
        //   main loop.  Create the remaining part and insert it at the
        //   new head position, and the update is complete.
        //
        //                   (oldHead > oldTail)
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
        //   newParts: [0, 2, 1, 4, 3, 7 ,6] <- create and insert 7
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]
        //                     newHead ^ newTail
        //
        // * Note that the order of the if/else clauses is not important
        // to the
        //   algorithm, as long as the null checks come first (to ensure
        //   we're always working on valid old parts) and that the final
        //   else clause comes last (since that's where the expensive
        //   moves occur). The order of remaining clauses is is just a
        //   simple guess at which cases will be most common.
        //
        // * TODO(kschaaf) Note, we could calculate the longest
        // increasing
        //   subsequence (LIS) of old items in new position, and only
        //   move those not in the LIS set. However that costs O(nlogn)
        //   time and adds a bit more code, and only helps make rare
        //   types of mutations require fewer moves. The above handles
        //   removes, adds, reversal, swaps, and single moves of
        //   contiguous items in linear time, in the minimum number of
        //   moves. As the number of multiple moves where LIS might help
        //   approaches a random shuffle, the LIS optimization becomes
        //   less helpful, so it seems not worth the code at this point.
        //   Could reconsider if a compelling case arises.
        while (oldHead <= oldTail && newHead <= newTail) {
            if (oldParts[oldHead] === null) {
                // `null` means old part at head has already been used
                // below; skip
                oldHead++;
            }
            else if (oldParts[oldTail] === null) {
                // `null` means old part at tail has already been used
                // below; skip
                oldTail--;
            }
            else if (oldKeys[oldHead] === newKeys[newHead]) {
                // Old head matches new head; update in place
                newParts[newHead] =
                    updatePart(oldParts[oldHead], newValues[newHead]);
                oldHead++;
                newHead++;
            }
            else if (oldKeys[oldTail] === newKeys[newTail]) {
                // Old tail matches new tail; update in place
                newParts[newTail] =
                    updatePart(oldParts[oldTail], newValues[newTail]);
                oldTail--;
                newTail--;
            }
            else if (oldKeys[oldHead] === newKeys[newTail]) {
                // Old head matches new tail; update and move to new tail
                newParts[newTail] =
                    updatePart(oldParts[oldHead], newValues[newTail]);
                insertPartBefore(containerPart, oldParts[oldHead], newParts[newTail + 1]);
                oldHead++;
                newTail--;
            }
            else if (oldKeys[oldTail] === newKeys[newHead]) {
                // Old tail matches new head; update and move to new head
                newParts[newHead] =
                    updatePart(oldParts[oldTail], newValues[newHead]);
                insertPartBefore(containerPart, oldParts[oldTail], oldParts[oldHead]);
                oldTail--;
                newHead++;
            }
            else {
                if (newKeyToIndexMap === undefined) {
                    // Lazily generate key-to-index maps, used for removals &
                    // moves below
                    newKeyToIndexMap = generateMap(newKeys, newHead, newTail);
                    oldKeyToIndexMap = generateMap(oldKeys, oldHead, oldTail);
                }
                if (!newKeyToIndexMap.has(oldKeys[oldHead])) {
                    // Old head is no longer in new list; remove
                    removePart(oldParts[oldHead]);
                    oldHead++;
                }
                else if (!newKeyToIndexMap.has(oldKeys[oldTail])) {
                    // Old tail is no longer in new list; remove
                    removePart(oldParts[oldTail]);
                    oldTail--;
                }
                else {
                    // Any mismatches at this point are due to additions or
                    // moves; see if we have an old part we can reuse and move
                    // into place
                    const oldIndex = oldKeyToIndexMap.get(newKeys[newHead]);
                    const oldPart = oldIndex !== undefined ? oldParts[oldIndex] : null;
                    if (oldPart === null) {
                        // No old part for this value; create a new one and
                        // insert it
                        const newPart = createAndInsertPart(containerPart, oldParts[oldHead]);
                        updatePart(newPart, newValues[newHead]);
                        newParts[newHead] = newPart;
                    }
                    else {
                        // Reuse old part
                        newParts[newHead] =
                            updatePart(oldPart, newValues[newHead]);
                        insertPartBefore(containerPart, oldPart, oldParts[oldHead]);
                        // This marks the old part as having been used, so that
                        // it will be skipped in the first two checks above
                        oldParts[oldIndex] = null;
                    }
                    newHead++;
                }
            }
        }
        // Add parts for any remaining new values
        while (newHead <= newTail) {
            // For all remaining additions, we insert before last new
            // tail, since old pointers are no longer valid
            const newPart = createAndInsertPart(containerPart, newParts[newTail + 1]);
            updatePart(newPart, newValues[newHead]);
            newParts[newHead++] = newPart;
        }
        // Remove any remaining unused old parts
        while (oldHead <= oldTail) {
            const oldPart = oldParts[oldHead++];
            if (oldPart !== null) {
                removePart(oldPart);
            }
        }
        // Save order of new parts for next round
        partListCache.set(containerPart, newParts);
        keyListCache.set(containerPart, newKeys);
    };
});
//# =repeat.js.map

const BIN_EXTS = [
  '3dm',
  '3ds',
  '3g2',
  '3gp',
  '7z',
  'a',
  'aac',
  'adp',
  'ai',
  'aif',
  'aiff',
  'alz',
  'ape',
  'apk',
  'ar',
  'arj',
  'asf',
  'au',
  'avi',
  'bak',
  'baml',
  'bh',
  'bin',
  'bk',
  'bmp',
  'btif',
  'bz2',
  'bzip2',
  'cab',
  'caf',
  'cgm',
  'class',
  'cmx',
  'cpio',
  'cr2',
  'cur',
  'dat',
  'dcm',
  'deb',
  'dex',
  'djvu',
  'dll',
  'dmg',
  'dng',
  'doc',
  'docm',
  'docx',
  'dot',
  'dotm',
  'dra',
  'DS_Store',
  'dsk',
  'dts',
  'dtshd',
  'dvb',
  'dwg',
  'dxf',
  'ecelp4800',
  'ecelp7470',
  'ecelp9600',
  'egg',
  'eol',
  'eot',
  'epub',
  'exe',
  'f4v',
  'fbs',
  'fh',
  'fla',
  'flac',
  'fli',
  'flv',
  'fpx',
  'fst',
  'fvt',
  'g3',
  'gh',
  'gif',
  'graffle',
  'gz',
  'gzip',
  'h261',
  'h263',
  'h264',
  'icns',
  'ico',
  'ief',
  'img',
  'ipa',
  'iso',
  'jar',
  'jpeg',
  'jpg',
  'jpgv',
  'jpm',
  'jxr',
  'key',
  'ktx',
  'lha',
  'lib',
  'lvp',
  'lz',
  'lzh',
  'lzma',
  'lzo',
  'm3u',
  'm4a',
  'm4v',
  'mar',
  'mdi',
  'mht',
  'mid',
  'midi',
  'mj2',
  'mka',
  'mkv',
  'mmr',
  'mng',
  'mobi',
  'mov',
  'movie',
  'mp3',
  'mp4',
  'mp4a',
  'mpeg',
  'mpg',
  'mpga',
  'mxu',
  'nef',
  'npx',
  'numbers',
  'nupkg',
  'o',
  'oga',
  'ogg',
  'ogv',
  'otf',
  'pages',
  'pbm',
  'pcx',
  'pdb',
  'pdf',
  'pea',
  'pgm',
  'pic',
  'png',
  'pnm',
  'pot',
  'potm',
  'potx',
  'ppa',
  'ppam',
  'ppm',
  'pps',
  'ppsm',
  'ppsx',
  'ppt',
  'pptm',
  'pptx',
  'psd',
  'pya',
  'pyc',
  'pyo',
  'pyv',
  'qt',
  'rar',
  'ras',
  'raw',
  'resources',
  'rgb',
  'rip',
  'rlc',
  'rmf',
  'rmvb',
  'rtf',
  'rz',
  's3m',
  's7z',
  'scpt',
  'sgi',
  'shar',
  'sil',
  'sketch',
  'slk',
  'smv',
  'snk',
  'so',
  'stl',
  'suo',
  'sub',
  'swf',
  'tar',
  'tbz',
  'tbz2',
  'tga',
  'tgz',
  'thmx',
  'tif',
  'tiff',
  'tlz',
  'ttc',
  'ttf',
  'txz',
  'udf',
  'uvh',
  'uvi',
  'uvm',
  'uvp',
  'uvs',
  'uvu',
  'viv',
  'vob',
  'war',
  'wav',
  'wax',
  'wbmp',
  'wdp',
  'weba',
  'webm',
  'webp',
  'whl',
  'wim',
  'wm',
  'wma',
  'wmv',
  'wmx',
  'woff',
  'woff2',
  'wrm',
  'wvx',
  'xbm',
  'xif',
  'xla',
  'xlam',
  'xls',
  'xlsb',
  'xlsm',
  'xlsx',
  'xlt',
  'xltm',
  'xltx',
  'xm',
  'xmind',
  'xpi',
  'xpm',
  'xwd',
  'xz',
  'z',
  'zip',
  'zipx'
];

function isFilenameBinary (str = '') {
  return BIN_EXTS.includes(str.split('.').pop())
}

// wraps await-lock in a simpler interface, with many possible locks
var locks = {};

/**
 * Create a new lock
 * @example
 * var lock = require('./lock')
 * async function foo () {
 *   var release = await lock('bar')
 *   // ...
 *   release()
 * }
 * @param {string} key
 * @returns {Promise<function(): void>}
 */
async function lock (key) {
  if (!(key in locks)) locks[key] = new AwaitLock();

  var lock = locks[key];
  await lock.acquireAsync();
  return lock.release.bind(lock)
}

function joinPath (...args) {
  var str = args[0];
  for (let v of args.slice(1)) {
    v = v && typeof v === 'string' ? v : '';
    let left = str.endsWith('/');
    let right = v.startsWith('/');
    if (left !== right) str += v;
    else if (left) str += v.slice(1);
    else str += '/' + v;
  }
  return str
}

/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// On IE11, classList.toggle doesn't accept a second argument.
// Since this is so minor, we just polyfill it.
if (window.navigator.userAgent.match('Trident')) {
    DOMTokenList.prototype.toggle = function (token, force) {
        if (force === undefined || force) {
            this.add(token);
        }
        else {
            this.remove(token);
        }
        return force === undefined ? true : force;
    };
}
/**
 * Stores the ClassInfo object applied to a given AttributePart.
 * Used to unset existing values when a new ClassInfo object is applied.
 */
const classMapCache = new WeakMap();
/**
 * Stores AttributeParts that have had static classes applied (e.g. `foo` in
 * class="foo ${classMap()}"). Static classes are applied only the first time
 * the directive is run on a part.
 */
// Note, could be a WeakSet, but prefer not requiring this polyfill.
const classMapStatics = new WeakMap();
/**
 * A directive that applies CSS classes. This must be used in the `class`
 * attribute and must be the only part used in the attribute. It takes each
 * property in the `classInfo` argument and adds the property name to the
 * element's `classList` if the property value is truthy; if the property value
 * is falsey, the property name is removed from the element's `classList`. For
 * example
 * `{foo: bar}` applies the class `foo` if the value of `bar` is truthy.
 * @param classInfo {ClassInfo}
 */
const classMap = directive((classInfo) => (part) => {
    if (!(part instanceof AttributePart) || (part instanceof PropertyPart) ||
        part.committer.name !== 'class' || part.committer.parts.length > 1) {
        throw new Error('The `classMap` directive must be used in the `class` attribute ' +
            'and must be the only part in the attribute.');
    }
    // handle static classes
    if (!classMapStatics.has(part)) {
        part.committer.element.className = part.committer.strings.join(' ');
        classMapStatics.set(part, true);
    }
    // remove old classes that no longer apply
    const oldInfo = classMapCache.get(part);
    for (const name in oldInfo) {
        if (!(name in classInfo)) {
            part.committer.element.classList.remove(name);
        }
    }
    // add new classes
    for (const name in classInfo) {
        if (!oldInfo || (oldInfo[name] !== classInfo[name])) {
            // We explicitly want a loose truthy check here because
            // it seems more convenient that '' and 0 are skipped.
            part.committer.element.classList.toggle(name, Boolean(classInfo[name]));
        }
    }
    classMapCache.set(part, classInfo);
});
//# =class-map.js.map

/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * For AttributeParts, sets the attribute if the value is defined and removes
 * the attribute if the value is undefined.
 *
 * For other part types, this directive is a no-op.
 */
const ifDefined = directive((value) => (part) => {
    if (value === undefined && part instanceof AttributePart) {
        if (value !== part.value) {
            const name = part.committer.name;
            part.committer.element.removeAttribute(name);
        }
    }
    else {
        part.setValue(value);
    }
});
//# =if-defined.js.map

function findParent (node, test) {
  if (typeof test === 'string') {
    // classname default
    var cls = test;
    test = el => el.classList && el.classList.contains(cls);
  }

  while (node) {
    if (test(node)) {
      return node
    }
    node = node.parentNode;
  }
}

function emit (el, evt, opts = {}) {
  opts.bubbles = ('bubbles' in opts) ? opts.bubbles : true;
  opts.composed = ('composed' in opts) ? opts.composed : true;
  el.dispatchEvent(new CustomEvent(evt, opts));
}

/*!
 * Dynamically changing favicons with JavaScript
 * Works in all A-grade browsers except Safari and Internet Explorer
 * Demo: http://mathiasbynens.be/demo/dynamic-favicons
 */

var _head = document.head || document.getElementsByTagName('head')[0]; // https://stackoverflow.com/a/2995536

const cssStr = css`
.dropdown {
  position: relative;

  --text-color--dropdown-default: #333;
  --text-color--dropdown-section: #aaa;
  --text-color--dropdown-icon: rgba(0, 0, 0, 0.65);
  --text-color--dropdown-btn--pressed: #dadada;
  --text-color--title: gray;
  --bg-color--dropdown: #fff;
  --bg-color--dropdown-item--hover: #eee;
  --border-color--dropdown: #dadada;
  --border-color--dropdown-item: #eee;
  --border-color--dropdown-section: rgba(0,0,0,.1);
  --border-color--dropdown-separator: #ddd;
}

@media (prefers-color-scheme: dark) {
  .dropdown {
    --text-color--dropdown-default: #ccc;
    --text-color--dropdown-section: #aaa;
    --text-color--dropdown-icon: #eee;
    --text-color--dropdown-btn--pressed: #2c2c2c;
    --text-color--title: gray;
    --bg-color--dropdown: #333;
    --bg-color--dropdown-item--hover: #444;
    --border-color--dropdown: #555;
    --border-color--dropdown-item: #666;
    --border-color--dropdown-section: rgba(0,0,0,.1);
    --border-color--dropdown-separator: #ddd;
  }
}

.dropdown.open .toggleable:not(.primary) {
  background: var(--text-color--dropdown-btn--pressed);
  box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.1);
  border-color: transparent;
  outline: 0;
}

.toggleable-container .dropdown-items {
  display: none;
}

.toggleable-container.hover:hover .dropdown-items,
.toggleable-container.open .dropdown-items {
  display: block;
}

.dropdown-items {
  width: 270px;
  position: absolute;
  right: 0px;
  z-index: 3000;
  background: var(--bg-color--dropdown);
  color: var(--text-color--dropdown-default);
  border: 1px solid var(--border-color--dropdown);
  border-radius: 0px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.dropdown-items .section {
  border-bottom: 1px solid var(--border-color--dropdown-section);
  padding: 5px 0;
}

.dropdown-items .section-header {
  padding: 2px 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-items .section-header.light {
  color: var(--text-color--dropdown-section);
  font-weight: 500;
}

.dropdown-items .section-header.small {
  font-size: 12px;
}

.dropdown-items hr {
  border: 0;
  border-bottom: 1px solid var(--border-color--dropdown-separator);
}

.dropdown-items.thin {
  width: 170px;
}

.dropdown-items.wide {
  width: 400px;
}

.dropdown-items.compact .dropdown-item {
  padding: 2px 15px;
  border-bottom: 0;
}

.dropdown-items.compact .description {
  margin-left: 0;
}

.dropdown-items.compact hr {
  margin: 5px 0;
}

.dropdown-items.roomy .dropdown-item {
  padding: 10px 15px;
}

.dropdown-items.very-roomy .dropdown-item {
  padding: 16px 40px 16px 20px;
}

.dropdown-items.rounded {
  border-radius: 16px;
}

.dropdown-items.no-border .dropdown-item {
  border-bottom: 0;
}

.dropdown-items.center {
  left: 50%;
  right: unset;
  transform: translateX(-50%);
}

.dropdown-items.left {
  right: initial;
  left: 0;
}

.dropdown-items.over {
  top: 0;
}

.dropdown-items.top {
  bottom: calc(100% + 5px);
}

.dropdown-items.with-triangle:before {
  content: '';
  position: absolute;
  top: -8px;
  right: 10px;
  width: 12px;
  height: 12px;
  z-index: 3;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid var(--bg-color--dropdown);
}

.dropdown-items.with-triangle.left:before {
  left: 10px;
}

.dropdown-items.with-triangle.center:before {
  left: 43%;
}

.dropdown-title {
  border-bottom: 1px solid var(--border-color--dropdown-item);
  padding: 2px 8px;
  font-size: 11px;
  color: var(--text-color--title);
}

.dropdown-item {
  display: block;
  padding: 7px 15px;
  border-bottom: 1px solid var(--border-color--dropdown-item);
}

.dropdown-item.disabled {
  opacity: 0.25;
}

.dropdown-item.no-border {
  border-bottom: 0;
}

.dropdown-item.selected {
  background: var(--bg-color--dropdown-item--hover);  
}

.dropdown-item:hover:not(.no-hover) {
  background: var(--bg-color--dropdown-item--hover);
  cursor: pointer;
}

.dropdown-item:hover:not(.no-hover) i:not(.fa-check-square) {
  color: var(--text-color--dropdown-default);
}

.dropdown-item:hover:not(.no-hover) .description {
  color: var(--text-color--dropdown-default);
}

.dropdown-item:hover:not(.no-hover).disabled {
  background: inherit;
  cursor: default;
}

.dropdown-item .fa,
.dropdown-item i {
  display: inline-block;
  width: 20px;
  color: var(--text-color--dropdown-icon);
}

.dropdown-item .fa-fw {
  margin-left: -3px;
  margin-right: 3px;
}

.dropdown-item img {
  display: inline-block;
  width: 16px;
  position: relative;
  top: 3px;
  margin-right: 6px;
}

.dropdown-item .btn .fa {
  color: inherit;
}

.dropdown-item .label {
  font-weight: 500;
  margin-bottom: 3px;
}

.dropdown-item .description {
  color: var(--text-color--muted);
  margin: 0;
  margin-left: 23px;
  margin-bottom: 3px;
  line-height: 1.5;
}

.dropdown-item .description.small {
  font-size: 12.5px;
}

.dropdown-item:first-of-type {
  border-radius: 2px 2px 0 0;
}

.dropdown-item:last-of-type {
  border-radius: 0 0 2px 2px;
}

`;

// globals
// =

var resolve;

// exported api
// =

// create a new context menu
// - returns a promise that will resolve to undefined when the menu goes away
// - example usage:
/*
create({
  // where to put the menu
  x: e.clientX,
  y: e.clientY,

  // align edge to right instead of left
  right: true,

  // use triangle
  withTriangle: true,

  // roomy style
  roomy: true,

  // no borders on items
  noBorders: false,

  // additional styles on dropdown-items
  style: 'font-size: 14px',

  // parent element to append to
  parent: document.body,

  // url to fontawesome css
  fontAwesomeCSSUrl: '/css/font-awesome.css',

  // menu items
  items: [
    // icon from font-awesome
    {icon: 'fa fa-link', label: 'Copy link', click: () => writeToClipboard('...')}
  ]

  // instead of items, can give render()
  render () {
    return html`
      <img src="smile.png" onclick=${contextMenu.destroy} />
    `
  }
}
*/
function create (opts) {
  // destroy any existing
  destroy();

  // extract attrs
  var parent = opts.parent || document.body;

  // render interface
  parent.appendChild(new BeakerContextMenu(opts));
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('click', onClickAnywhere);

  // return promise
  return new Promise(_resolve => {
    resolve = _resolve;
  })
}

function destroy (value) {
  const el = document.querySelector('beaker-context-menu');
  if (el) {
    el.parentNode.removeChild(el);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('click', onClickAnywhere);
    resolve(value);
  }
}

// global event handlers
// =

function onKeyUp (e) {
  e.preventDefault();
  e.stopPropagation();

  if (e.keyCode === 27) {
    destroy();
  }
}

function onClickAnywhere (e) {
  if (!findParent(e.target, el => el.tagName === 'BEAKER-CONTEXT-MENU')) {
    // click is outside the context-menu, destroy
    destroy();
  }
}

// internal
// =

class BeakerContextMenu extends LitElement {
  constructor ({x, y, right, center, top, withTriangle, roomy, veryRoomy, rounded, noBorders, style, items, fontAwesomeCSSUrl, render}) {
    super();
    this.x = x;
    this.y = y;
    this.right = right || false;
    this.center = center || false;
    this.top = top || false;
    this.withTriangle = withTriangle || false;
    this.roomy = roomy || false;
    this.veryRoomy = veryRoomy || false;
    this.rounded = rounded || false;
    this.noBorders = noBorders || false;
    this.customStyle = style || undefined;
    this.items = items;
    this.fontAwesomeCSSUrl = fontAwesomeCSSUrl || '/vendor/beaker-app-stdlib/css/fontawesome.css';
    this.customRender = render;
  }

  // calls the global destroy
  // (this function exists so that custom renderers can destroy with this.destroy)
  destroy () {
    destroy();
  }

  // rendering
  // =

  render () {
    const cls = classMap({
      'dropdown-items': true,
      right: this.right,
      center: this.center,
      left: !this.right,
      top: this.top,
      'with-triangle': this.withTriangle,
      roomy: this.roomy,
      'very-roomy': this.veryRoomy,
      rounded: this.rounded,
      'no-border': this.noBorders
    });
    var style = '';
    if (this.x) style += `left: ${this.x}px; `;
    if (this.y) style += `top: ${this.y}px; `;
    return html`
      ${this.fontAwesomeCSSUrl ? html`<link rel="stylesheet" href="${this.fontAwesomeCSSUrl}">` : ''}
      <div class="context-menu dropdown" style="${style}">
        ${this.customRender
          ? this.customRender.call(this)
          : html`
            <div class="${cls}" style="${ifDefined(this.customStyle)}">
              ${this.items.map(item => {
                if (item === '-') {
                  return html`<hr />`
                }
                if (item.type === 'html') {
                  return item
                }
                var icon = item.icon;
                if (typeof icon === 'string' && !icon.includes(' ')) {
                  icon = 'fa fa-' + icon;
                }
                if (item.disabled) {
                  return html`
                    <div class="dropdown-item disabled">
                      ${icon !== false ? html`<i class="${icon}"></i>` : ''}
                      ${item.label}
                    </div>
                  `
                }
                if (item.href) {
                  return html`
                    <a class="dropdown-item ${item.selected ? 'selected' : ''}" href=${item.href}>
                      ${icon !== false ? html`<i class="${icon}"></i>` : ''}
                      ${item.label}
                    </a>
                  `
                }
                return html`
                  <div class="dropdown-item ${item.selected ? 'selected' : ''}" @click=${() => { destroy(); item.click(); }}>
                    ${typeof icon === 'string'
                      ? html`<i class="${icon}"></i>`
                      : icon ? icon : ''}
                    ${item.label}
                  </div>
                `
              })}
            </div>`
        }
      </div>`
  }
}

BeakerContextMenu.styles = css`
${cssStr}

.context-menu {
  position: fixed;
  z-index: 10000;
}

.dropdown-items {
  width: auto;
  white-space: nowrap;
}

a.dropdown-item {
  color: inherit;
  text-decoration: none;
}

.dropdown-item,
.dropdown-items.roomy .dropdown-item {
  padding-right: 30px; /* add a little cushion to the right */
}

/* custom icon css */
.fa-long-arrow-alt-right.custom-link-icon {
  position: relative;
  transform: rotate(-45deg);
  left: 1px;
}
.fa-custom-path-icon:after {
  content: './';
  letter-spacing: -1px;
  font-family: var(--code-font);
}
`;

customElements.define('beaker-context-menu', BeakerContextMenu);

function writeToClipboard (str) {
  var textarea = document.createElement('textarea');
  textarea.textContent = str;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

const cssStr$1 = css`
:host {
  --toast-min-width: 350px;
  --toast-padding: 10px 15px;
  --toast-font-size: 16px;
}

.toast-wrapper {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 20000;
  transition: opacity 0.1s ease;
}
.toast-wrapper.hidden {
  opacity: 0;
}
.toast {
  position: relative;
  min-width: var(--toast-min-width);
  max-width: 450px;
  background: #ddd;
  margin: 0;
  padding: var(--toast-padding);
  border-radius: 4px;
  font-size: var(--toast-font-size);
  color: #fff;
  background: rgba(0, 0, 0, 0.75);
  -webkit-font-smoothing: antialiased;
  font-weight: 600;
}
.toast.error {
  padding-left: 38px;
}
.toast.success {
  padding-left: 48px;
}
.toast.success:before,
.toast.error:before {
  position: absolute;
  left: 18px;
  top: 5px;
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", Ubuntu, Cantarell, "Oxygen Sans", "Helvetica Neue", sans-serif;
  font-size: 22px;
  font-weight: bold;
}
.toast.primary {
  background: var(--color-blue);
}
.toast.success {
  background: #26b33e;
}
.toast.success:before {
  content: '✓';
}
.toast.error {
  background: #c72e25;
}
.toast.error:before {
  content: '!';
}
.toast .toast-btn {
  position: absolute;
  right: 15px;
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
}
`;

// exported api
// =

function create$1 (message, type = '', time = 5000, button = null) {
  // destroy existing
  destroy$1();

  // render toast
  document.body.appendChild(new BeakerToast({message, type, button}));
  setTimeout(destroy$1, time);
}

function destroy$1 () {
  var toast = document.querySelector('beaker-toast');

  if (toast) {
    // fadeout before removing element
    toast.shadowRoot.querySelector('.toast-wrapper').classList.add('hidden');
    setTimeout(() => toast.remove(), 500);
  }
}

// internal
// =

class BeakerToast extends LitElement {
  constructor ({message, type, button}) {
    super();
    this.message = message;
    this.type = type;
    this.button = button;
  }

  render () {
    const onButtonClick = this.button ? (e) => { destroy$1(); this.button.click(e); } : undefined;
    return html`
    <div id="toast-wrapper" class="toast-wrapper ${this.button ? '' : 'nomouse'}">
      <p class="toast ${this.type}">${this.message} ${this.button ? html`<a class="toast-btn" @click=${onButtonClick}>${this.button.label}</a>` : ''}</p>
    </div>
    `
  }
}
BeakerToast.styles = cssStr$1;

customElements.define('beaker-toast', BeakerToast);

const cssStr$2 = css`
/**
 * New button styles
 * We should replace buttons.css with this
 */
button {
  --bg-color--button: #fff;
  --bg-color--button--hover: #f5f5f5;
  --bg-color--button--active: #eee;
  --bg-color--button--pressed: #6d6d79;
  --bg-color--button--disabled: #fff;
  --bg-color--primary-button: #5289f7;
  --bg-color--primary-button--hover: rgb(73, 126, 234);
  --bg-color--transparent-button: transparent;
  --bg-color--transparent-button--hover: #f5f5fa;
  --bg-color--transparent-button--pressed: rgba(0,0,0,.1);
  --bg-color--button-gray: #fafafa;
  --bg-color--button-gray--hover: #f5f5f5;
  --text-color--button: #333;
  --text-color--button--pressed: #fff;
  --text-color--button--disabled: #999;
  --text-color--primary-button: #fff;
  --border-color--button: #d4d7dc;
  --border-color--primary-button: #2864dc;
  --box-shadow-color--button: rgba(0,0,0,.05);
  --box-shadow-color--button--hover: rgba(0,0,0,.5);
  --box-shadow-color--transparent-button: rgba(0,0,0,.25);

  background: var(--bg-color--button);
  border: 1px solid var(--border-color--button);
  border-radius: 3px;
  box-shadow: 0 1px 1px var(--box-shadow-color--button);
  padding: 5px 10px;
  color: var(--text-color--button);
  outline: 0;
  cursor: pointer;
}

@media (prefers-color-scheme: dark) {
  button {
    --bg-color--button: #333;
    --bg-color--button--hover: #444;
    --bg-color--button--active: #555;
    --bg-color--button--pressed: #6d6d6d;
    --bg-color--button--disabled: #444;
    --bg-color--primary-button: #5289f7;
    --bg-color--primary-button--hover: rgb(73, 126, 234);
    --bg-color--transparent-button: transparent;
    --bg-color--transparent-button--hover: #444;
    --bg-color--transparent-button--pressed: rgba(0,0,0,.1);
    --bg-color--button-gray: #fafafa;
    --bg-color--button-gray--hover: #f5f5f5;
    --text-color--button: #ccc;
    --text-color--button--pressed: #fff;
    --text-color--button--disabled: #aaa;
    --text-color--primary-button: #fff;
    --border-color--button: #777;
    --border-color--primary-button: #2864dc;
    --box-shadow-color--button: rgba(0,0,0,.05);
    --box-shadow-color--button--hover: rgba(0,0,0,.5);
    --box-shadow-color--transparent-button: rgba(0,0,0,.25);
  }
}

button:hover {
  background: var(--bg-color--button--hover);
}

button:active {
  background: var(--bg-color--button--active);
}

button.big {
  padding: 6px 12px;
}

button.block {
  display: block;
  width: 100%;
}

button.pressed {
  box-shadow: inset 0 1px 1px var(--box-shadow-color--button--hover);
  background: var(--bg-color--button--pressed);
  color: var(--text-color--button--pressed);
  border-color: transparent;
  border-radius: 4px;
}

button.primary {
  background: var(--bg-color--primary-button);
  border-color: var(--border-color--primary-button);
  color: var(--text-color--primary-button);
  box-shadow: 0 1px 1px rgba(0,0,0,.1);
}

button.primary:hover {
  background: var(--bg-color--primary-button--hover);
}

button.gray {
  background: var(--bg-color--button-gray);
}

button.gray:hover {
  background: var(--bg-color--button-gray--hover);
}

button[disabled] {
  border-color: var(--border-color--semi-light) !important;
  background: var(--bg-color--button--disabled) !important;
  color: var(--text-color--button--disabled) !important;
  cursor: default !important;
}

button.rounded {
  border-radius: 16px;
}

button.flat {
  box-shadow: none; 
}

button.noborder {
  border-color: transparent;
}

button.transparent {
  background: var(--bg-color--transparent-button);
  border-color: transparent;
  box-shadow: none; 
}

button.transparent[disabled] {
  border-color: transparent !important;
}

button.transparent:hover {
  background: var(--bg-color--transparent-button--hover);
}

button.transparent.pressed {
  background: var(--bg-color--transparent-button--pressed);
  box-shadow: inset 0 1px 2px var(--box-shadow-color--transparent-button);
  color: inherit;
}

.radio-group button {
  background: transparent;
  border: 0;
  box-shadow: none;
}

.radio-group button.pressed {
  background: var(--bg-color--button--pressed);
  border-radius: 30px;
}

.btn-group {
  display: inline-flex;
}

.btn-group button {
  border-radius: 0;
  border-right-width: 0;
}

.btn-group button:first-child {
  border-top-left-radius: 3px;
  border-bottom-left-radius: 3px;
}

.btn-group button:last-child {
  border-top-right-radius: 3px;
  border-bottom-right-radius: 3px;
  border-right-width: 1px;
}

.btn-group.rounded button:first-child {
  border-top-left-radius: 14px;
  border-bottom-left-radius: 14px;
  padding-left: 14px;
}

.btn-group.rounded button:last-child {
  border-top-right-radius: 14px;
  border-bottom-right-radius: 14px;
  padding-right: 14px;
}
`;

const cssStr$3 = css`
.spinner {
  display: inline-block;
  height: 14px;
  width: 14px;
  animation: rotate 1s infinite linear;
  color: #aaa;
  border: 2px solid;
  border-right-color: transparent;
  border-radius: 50%;
  transition: color 0.25s;
}

.spinner.reverse {
  animation: rotate 2s infinite linear reverse;
}

@keyframes rotate {
  0%    { transform: rotate(0deg); }
  100%  { transform: rotate(360deg); }
}
`;

const cssStr$4 = css`
${cssStr$2}
${cssStr$3}

:host {
  display: block;
  overflow-y: auto;
}

.empty {
  font-style: italic;
  color: #eee7;
  padding: 10px 16px;
}

.path {
  position: relative;
  padding: 0 4px;
  font-size: 12px;
  color: #bbb;
  overflow-x: auto;
  white-space: nowrap;
  border: 1px solid #555;
  background: #444;
}

.path a {
  display: block;
  padding: 4px;
}

.path a:hover {
  cursor: default;
}

.path .fa-angle-right {
  padding: 2px;
}

.path .spinner {
  position: absolute;
  width: 10px;
  height: 10px;
  top: 4px;
  right: 5px;
}

.listing {
  height: calc(100% - 25px); /* subtract 25px to account for the .path space */
}

.listing .item {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  cursor: pointer;
}

.listing .item:hover {
  background: #445;
}

.listing .item.selected {
  background: var(--blue);
  color: #fff;
}

.listing .item.new-file {
  opacity: 0.5;
}

.listing .item .icon {
  padding-right: 6px;
}

.listing .item .name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.listing .item .size {
  color: rgba(255, 255, 255,.5);
}

@media (max-width: 600px) {
  .toolbar .btn-label {
    display: none;
  }
}

@media (min-width: 601px) {
  .tooltip-onsmall[data-tooltip]:hover:after,
  .tooltip-onsmall[data-tooltip]:hover:before {
    display: none;
  }
}
`;

class FilesExplorer extends LitElement {
  static get properties () {
    return {
      url: {type: String, reflect: true},
      openFilePath: {type: String, attribute: 'open-file-path'},
      isLoading: {type: Boolean},
      readOnly: {type: Boolean},
      items: {type: Array}
    }
  }

  static get styles () {
    return [cssStr$4]
  }

  get isDrive () {
    return this.url && this.url.startsWith('hyper:')
  }

  get drive () {
    return beaker.hyperdrive.drive(this.url)
  }

  get origin () {
    let urlp = new URL(this.url);
    return urlp.origin
  }

  get viewedDriveVersion () {
    let urlp = new URL(this.url);
    let parts = urlp.hostname.split('+');
    if (parts.length === 2) return parts[1]
    return 'latest'
  }

  get pathname () {
    let urlp = new URL(this.url);
    return urlp.pathname
  }

  constructor () {
    super();
    this.url = '';
    this.openFilePath = undefined;
    this.isLoading = true;
    this.readOnly = true;
    this.folderPath = '';
    this.currentFolder = null;
    this.items = [];
    this.watcher = undefined;
    this.load();
  }

  attributeChangedCallback (name, oldval, newval) {
    super.attributeChangedCallback(name, oldval, newval);
    if (name === 'url') {
      this.load();
    }
  }

  async load () {
    this.isLoading = true;

    if (this.watcher && this.watchingDriveUrl !== this.origin) {
      this.watcher.close();
      this.watcher = undefined;
    }

    var items = [];
    if (this.isDrive) {
      let drive = this.drive;

      let info = await drive.getInfo();
      this.readOnly = !info.writable;

      let st;
      let folderPath = this.pathname;
      while (!st && folderPath !== '/') {
        try { st = await drive.stat(folderPath); }
        catch (e) { /* ignore */ }
        if (!st || !st.isDirectory()) {
          folderPath = '/' + (folderPath.split('/').slice(0, -1).filter(Boolean).join('/'));
        }
      }
      this.folderPath = folderPath;

      var parentDrive = await this.getParentDriveInfo();
      items = await drive.readdir(folderPath, {includeStats: true});
      items.forEach(item => {
        item.path = joinPath(this.folderPath, item.name);
        item.url = joinPath(drive.url, item.path);
        item.shareUrl = joinPath(parentDrive.info.url, item.path.replace(parentDrive.path, ''));
      });
      items.sort((a, b) => {
        if (a.stat.isDirectory() && !b.stat.isDirectory()) return -1
        if (!a.stat.isDirectory() && b.stat.isDirectory()) return 1
        return a.name.localeCompare(b.name)
      });

      this.currentFolder = await drive.stat(folderPath);
      this.currentFolder.path = folderPath;
      this.currentFolder.name = folderPath.split('/').pop() || '/';

      if (!this.watcher) {
        let isFirstWatchEvent = true;
        this.watchingDriveUrl = this.origin;
        this.watcher = drive.watch(e => {
          // HACK
          // for some reason, the watchstream is firing 'changed' immediately
          // ignore the first emit
          // -prf
          if (isFirstWatchEvent) {
            isFirstWatchEvent = false;
            return
          }
          this.load();
        });
      }
    }

    this.items = items;
    this.isLoading = false;
  }

  async getParentDriveInfo () {
    var drive = this.drive;
    var pathParts = this.folderPath.split('/').filter(Boolean);
    while (pathParts.length) {
      let path = '/' + pathParts.join('/');
      let stat = await drive.stat(path).catch(e => undefined);
      if (stat.mount) {
        return {
          path,
          info: await beaker.hyperdrive.drive(stat.mount.key).getInfo()
        }
      }
      pathParts.pop();
    }
    return {path: '/', info: await drive.getInfo()}
  }

  // rendering
  // =

  render () {
    if (!this.items.length && this.isLoading) {
      return html`
        <div class="toolbar">
          <div>Loading...</div>
        </div>
      `
    }
    if (!this.isDrive) {
      return html`
        <link rel="stylesheet" href="beaker://assets/font-awesome.css">
        <div class="empty"><span class="fas fa-fw fa-info-circle"></span> This site doesn't support file listings</div>
      `
    }
    const icon = item => {
      if (item.stat.mount) return html`<span class="fas fa-fw fa-external-link-square-alt"></span>`
      if (item.stat.isDirectory()) return html`<span class="fa-fw fas fa-folder"></span>`
      return html`<span class="fa-fw far fa-file"></span>`
    };
    return html`
      <link rel="stylesheet" href="beaker://assets/font-awesome.css">
      <div class="path">
        <a>
          <span class="fa-fw ${this.currentFolder.mount ? 'fas fa-external-link-square-alt' : 'far fa-folder'}"></span>
          ${this.currentFolder.name} ${this.currentFolder.mount ? html`(<code>${this.currentFolder.mount.key.slice(0, 4)}..${this.currentFolder.mount.key.slice(-2)}</code>)` : ''}
        </a>
        ${this.isLoading ? html`<span class="spinner"></span>` : ''}
      </div>
      <div class="listing" @contextmenu=${this.onContextmenuListing}>
        ${this.folderPath !== '/' ? html`
          <div class="item" @click=${this.onClickUpdog}>
            <span class="icon"><span class="fa-fw fas fa-level-up-alt"></span></span>
            <span class="name">..</span>
          </div>
        ` : ''}
        ${repeat(this.items, item => html`
          <div class=${classMap({item: true, selected: item.path === this.openFilePath})}
            @click=${e => this.onClickItem(e, item)}
            @contextmenu=${e => this.onContextmenuItem(e, item)}
          >
            <span class="icon">${icon(item)}</span>
            <span class="name">
              ${item.name}
            </span>
          </div>
        `)}
        ${!this.readOnly ? html`
          <div class=${classMap({item: true, 'new-file': true})} @click=${this.onClickNewFile}>
            <span class="icon"><span class="fas fa-fw fa-plus"></span></span>
            <span class="name">New file</span>
          </div>
        ` : ''}
      </div>
    `
  }

  // events
  // =

  onContextmenuListing (e) {
    e.preventDefault();
    e.stopPropagation();
    var folderItemUrls = this.items.map(item => item.url);
    emit(this, 'show-menu', {detail: {x: e.clientX, y: e.clientY, folderPath: this.folderPath, folderItemUrls}});
  }

  onContextmenuItem (e, item) {
    e.preventDefault();
    e.stopPropagation();
    emit(this, 'show-menu', {detail: {x: e.clientX, y: e.clientY, folderPath: this.folderPath, item}});
  }

  onClickUpdog (e) {
    var upPath = this.folderPath.split('/').filter(Boolean).slice(0, -1).join('/');
    this.url = joinPath(this.origin, upPath);
  }

  onClickItem (e, item) {
    if (item.stat.isFile()) {
      // open the file
      let url = joinPath(this.origin, this.folderPath, item.name);
      emit(this, 'open', {bubbles: true, composed: true, detail: {url}});
    } else {
      // navigate in-UI to the folder
      this.url = joinPath(this.origin, this.folderPath, item.name);
    }
  }

  onClickNewFile (e, item) {
    e.preventDefault();
    e.stopPropagation();
    emit(this, 'new-file', {detail: {folderPath: this.folderPath}});
  }
}

customElements.define('files-explorer', FilesExplorer);

const cssStr$5 = css`
textarea {
  line-height: 1.4;
}

input,
textarea {
  border-radius: 4px;
  color: var(--text-color--default);
  background: var(--bg-color--default);
  border: 1px solid var(--border-color--light);
  box-sizing: border-box;
}
textarea {
  padding: 7px;
}

input[type="checkbox"],
textarea[type="checkbox"],
input[type="radio"],
textarea[type="radio"],
input[type="range"],
textarea[type="range"] {
  padding: 0;
}

input[type="checkbox"]:focus,
textarea[type="checkbox"]:focus,
input[type="radio"]:focus,
textarea[type="radio"]:focus,
input[type="range"]:focus,
textarea[type="range"]:focus {
  box-shadow: none;
}

input[type="radio"],
textarea[type="radio"] {
  width: 14px;
  height: 14px;
  outline: none;
  -webkit-appearance: none;
  border-radius: 50%;
  cursor: pointer;
  transition: border 0.1s ease;
}

input[type="radio"]:hover,
textarea[type="radio"]:hover {
  border: 1px solid var(--blue);
}

input[type="radio"]:checked,
textarea[type="radio"]:checked {
  border: 4.5px solid var(--blue);
}

input[type="file"],
textarea[type="file"] {
  padding: 0;
  border: 0;
  line-height: 1;
}

input[type="file"]:focus,
textarea[type="file"]:focus {
  border: 0;
  box-shadow: none;
}

input:focus,
textarea:focus,
select:focus {
  outline: 0;
  border: 1px solid rgba(41, 95, 203, 0.8);
  box-shadow: 0 0 0 2px rgba(41, 95, 203, 0.2);
}

input.error,
textarea.error,
select.error {
  border: 1px solid rgba(209, 48, 39, 0.75);
}

input.error:focus,
textarea.error:focus,
select.error:focus {
  box-shadow: 0 0 0 2px rgba(204, 47, 38, 0.15);
}

input.nofocus:focus,
textarea.nofocus:focus,
select.nofocus:focus {
  outline: 0;
  box-shadow: none;
  border: initial;
}

input.inline {
  height: auto;
  border: 1px solid transparent;
  border-radius: 0;
  background: transparent;
  cursor: text;
  padding: 3px 5px;
  line-height: 1;
}

input.big,
textarea.big {
  height: 38px;
  padding: 0 10px;
  font-size: 14px;
}

textarea.big {
  padding: 5px 10px;
}

input.huge,
textarea.huge {
  height: 40px;
  padding: 0 10px;
  font-size: 18px;
}

textarea.huge {
  padding: 5px 10px;
}

input.inline:focus,
input.inline:hover {
  border: 1px solid #ccc;
  box-shadow: none;
}

input.inline:focus {
  background: #fff;
}

.input-file-picker {
  display: flex;
  align-items: center;
  padding: 3px;
  border-radius: 2px;
  border: 1px solid #d9d9d9;
  color: var(--text-color--pretty-light);
}

.input-file-picker span {
  flex: 1;
  padding-left: 3px;
}

::-webkit-input-placeholder {
  color: var(--text-color--pretty-light);
}

.big::-webkit-input-placeholder,
.huge::-webkit-input-placeholder {
  font-size: 0.9em;
}

label {
  font-weight: 500;
}

input[disabled][data-tooltip],
label[disabled][data-tooltip] {
  cursor: help;
}

input[disabled][data-tooltip] *,
label[disabled][data-tooltip] * {
  cursor: help;
}

label.required:after {
  content: '*';
  color: red;
}

.toggle {
  display: flex;
  align-items: center;
  flex-direction: row;
  margin-bottom: 10px;
  cursor: pointer;
  overflow: initial;
}

.toggle .switch {
  margin-right: 10px;
}

.toggle * {
  cursor: pointer;
}

.toggle.disabled {
  cursor: default;
}

.toggle.disabled * {
  cursor: default;
}

.toggle input {
  display: none;
}

.toggle .text {
  font-weight: 400;
}

.toggle .switch {
  display: inline-block;
  position: relative;
  width: 32px;
  height: 17px;
}

.toggle .switch:before,
.toggle .switch:after {
  position: absolute;
  display: block;
  content: '';
}

.toggle .switch:before {
  width: 100%;
  height: 100%;
  border-radius: 40px;
  background: #dadada;
}

.toggle .switch:after {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  left: 3px;
  top: 3px;
  background: #fafafa;
  transition: transform 0.15s ease;
}

.toggle input:checked:not(:disabled) + .switch:before {
  background: #41b855;
}

.toggle input:checked:not(:disabled) + .switch:after {
  transform: translateX(15px);
}

.toggle.disabled {
  color: var(--text-color--pretty-light);
}

label.checkbox-container {
  display: flex;
  align-items: center;
  height: 15px;
  font-weight: 400;
}

label.checkbox-container input[type="checkbox"] {
  width: 15px;
  height: 15px;
  margin: 0 5px 0 0;
}


`;

const cssStr$6 = css`
${cssStr$2}
${cssStr$5}

.popup-wrapper {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 6000;
  background: rgba(0, 0, 0, 0.45);
  font-style: normal;
  overflow-y: auto;
}

.popup-inner {
  background: var(--bg-color--default);
  box-shadow: 0 2px 25px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.55);
  border-radius: 4px;
  width: 450px;
  margin: 80px auto;
  overflow: hidden;
}

.popup-inner .error {
  color: #d80b00 !important;
  margin: 10px 0 !important;
  font-style: italic;
}

.popup-inner .head {
  position: relative;
  background: var(--bg-color--semi-light);
  padding: 7px 12px;
  width: 100%;
  border-bottom: 1px solid var(--border-color--light);
  border-radius: 4px 4px 0 0;
}

.popup-inner .head .title {
  font-size: 0.95rem;
  font-weight: 500;
}

.popup-inner .head .close-btn {
  position: absolute;
  top: 8px;
  right: 12px;
  cursor: pointer;
}

.popup-inner .body {
  padding: 12px;
}

.popup-inner .body > div:not(:first-child) {
  margin-top: 20px;
}

.popup-inner p:first-child {
  margin-top: 0;
}

.popup-inner p:last-child {
  margin-bottom: 0;
}

.popup-inner select {
  height: 28px;
}

.popup-inner textarea,
.popup-inner label:not(.checkbox-container),
.popup-inner select,
.popup-inner input {
  display: block;
  width: 100%;
}

.popup-inner label.toggle {
  display: flex;
  justify-content: flex-start;
}

.popup-inner label.toggle .text {
  margin-right: 10px;
}

.popup-inner label.toggle input {
  display: none;
}

.popup-inner label {
  margin-bottom: 3px;
  color: var(--text-color--light);
}

.popup-inner textarea,
.popup-inner input {
  margin-bottom: 10px;
}

.popup-inner textarea {
  height: 60px;
  resize: vertical;
}

.popup-inner .actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid var(--border-color--light);
}

.popup-inner .actions .left,
.popup-inner .actions .link {
  margin-right: auto;
}

.popup-inner .actions .btn,
.popup-inner .actions .success,
.popup-inner .actions .primary {
  margin-left: 5px;
}

.popup-inner .actions .spinner {
  width: 10px;
  height: 10px;
  border-width: 1.2px;
}
`;

// exported api
// =

class BasePopup extends LitElement {
  constructor () {
    super();

    const onGlobalKeyUp = e => {
      // listen for the escape key
      if (this.shouldCloseOnEscape && e.keyCode === 27) {
        this.onReject();
      }
    };
    document.addEventListener('keyup', onGlobalKeyUp);

    // cleanup function called on cancel
    this.cleanup = () => {
      document.removeEventListener('keyup', onGlobalKeyUp);
    };
  }

  get shouldShowHead () {
    return true
  }

  get shouldCloseOnOuterClick () {
    return true
  }

  get shouldCloseOnEscape () {
    return true
  }

  // management
  //

  static async coreCreate (parentEl, Class, ...args) {
    var popupEl = new Class(...args);
    parentEl.appendChild(popupEl);

    const cleanup = () => {
      popupEl.cleanup();
      popupEl.remove();
    };

    // return a promise that resolves with resolve/reject events
    return new Promise((resolve, reject) => {
      popupEl.addEventListener('resolve', e => {
        resolve(e.detail);
        cleanup();
      });

      popupEl.addEventListener('reject', e => {
        reject();
        cleanup();
      });
    })
  }

  static async create (Class, ...args) {
    return BasePopup.coreCreate(document.body, Class, ...args)
  }

  static destroy (tagName) {
    var popup = document.querySelector(tagName);
    if (popup) popup.onReject();
  }

  // rendering
  // =

  render () {
    return html`
      <div class="popup-wrapper" @click=${this.onClickWrapper}>
        <div class="popup-inner">
          ${this.shouldShowHead ? html`
            <div class="head">
              <span class="title">${this.renderTitle()}</span>
              <span title="Cancel" @click=${this.onReject} class="close-btn square">&times;</span>
            </div>
          ` : ''}
          <div class="body">
            ${this.renderBody()}
          </div>
        </div>
      </div>
    `
  }

  renderTitle () {
    // should be overridden by subclasses
  }

  renderBody () {
    // should be overridden by subclasses
  }

  // events
  // =

  onClickWrapper (e) {
    if (e.target.classList.contains('popup-wrapper') && this.shouldCloseOnOuterClick) {
      this.onReject();
    }
  }

  onReject (e) {
    if (e) e.preventDefault();
    this.dispatchEvent(new CustomEvent('reject'));
  }
}

BasePopup.styles = [cssStr$6];

// exported api
// =

class ResizeImagePopup extends BasePopup {
  constructor (thumbUrl) {
    super();
    this.thumbUrl = thumbUrl;
    this.width = 256;
    this.height = 256;
    this.maintainAspectRatio = true;
    this.loadImg(thumbUrl);
  }

  get shouldCloseOnOuterClick () {
    return false
  }

  // management
  //

  static async create (thumbUrl) {
    return BasePopup.create(ResizeImagePopup, thumbUrl)
  }

  static destroy () {
    return BasePopup.destroy('beaker-edit-thumb')
  }

  // rendering
  // =

  renderTitle () {
    return `Resize Photo`
  }

  renderBody () {
    return html`
      <form @submit=${this.onSubmit}>
        <div class="controls">
          <div class="canvas-container">
            <canvas id="the-canvas"></canvas>
          </div>
          <table>
            <tr>
              <td><label for="width">Width</label></td>
              <td><input type="text" id="width" name="width" value=${this.width} @keyup=${this.onChangeWidth}>px</td>
            </tr>
            <tr>
              <td><label for="height">Height</label></td>
              <td><input type="text" id="height" name="height" value=${this.height} @keyup=${this.onChangeHeight}>px</td>
            </tr>
            <tr>
              <td></td>
              <td>
                <input type="checkbox" id="should-maintain" name="should-maintain" ?checked=${this.maintainAspectRatio} @change=${this.onChangeCrop}>
                <label for="should-maintain">Maintain Aspect Ratio</label>
              </td>
            </tr>
          </table>
        </div>

        <div class="actions">
          <button type="button" class="btn" @click=${this.onReject} tabindex="3">Cancel</button>
          <button type="submit" class="btn primary" tabindex="2">Save</button>
        </div>
      </form>
    `
  }

  // canvas handling
  // =

  async loadImg (url) {
    var base64buf = await beaker.hyperdrive.readFile(url, 'base64');
    this.img = document.createElement('img');
    this.img.src = `data:image/${url.split('.').pop()};base64,${base64buf}`;
    this.img.onload = () => {
      this.width = this.img.width;
      this.height = this.img.height;
      this.shadowRoot.querySelector('input[name="width"]').value = this.width;
      this.shadowRoot.querySelector('input[name="height"]').value = this.height;
      this.updateCanvas();
    };
  }

  updateCanvas () {
    var canvas = this.shadowRoot.getElementById('the-canvas');
    if (canvas) {
      canvas.setAttribute('width', this.width);
      canvas.setAttribute('height', this.height);

      var ctx = canvas.getContext('2d');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.save();
      ctx.drawImage(this.img, 0, 0, this.width, this.height);
      ctx.restore();
    }
  }

  // events
  // =

  async onChangeWidth (e) {
    this.width = Number(e.currentTarget.value);
    if (this.maintainAspectRatio) {
      this.height = this.width * this.img.height / this.img.width;
      this.shadowRoot.querySelector('input[name="height"]').value = this.height;
    }
    await this.requestUpdate();
    this.updateCanvas();
  }

  async onChangeHeight (e) {
    this.height = Number(e.currentTarget.value);
    if (this.maintainAspectRatio) {
      this.width = this.height * this.img.width / this.img.height;
      this.shadowRoot.querySelector('input[name="width"]').value = this.width;
    }
    await this.requestUpdate();
    this.updateCanvas();
  }

  async onChangeCrop (e) {
    this.maintainAspectRatio = !!e.currentTarget.checked;
    this.height = this.width * this.img.height / this.img.width;
    this.shadowRoot.querySelector('input[name="height"]').value = this.height;
    await this.requestUpdate();
    this.updateCanvas();
  }

  onSubmit (e) {
    e.preventDefault();
    e.stopPropagation();

    var canvas = this.shadowRoot.getElementById('the-canvas');
    var dataUrl = canvas.toDataURL(this.thumbUrl.endsWith('.png') ? 'image/png' : 'image/jpeg');

    this.dispatchEvent(new CustomEvent('resolve', {detail: dataUrl}));
  }
}
ResizeImagePopup.styles = [cssStr$6, css`
.canvas-container {
  display: flex;
  align-items: center;
  width: 334px;
  height: 300px;
  padding: 10px;
  overflow: auto;
  background: #fafafa;
}

canvas {
  display: block;
  margin: 0 auto;
}

.controls {
  color: #333;
}

table tr > td:first-child {
  text-align: right;
  padding-right: 4px;
}

table label {
  display: inline !important;
  width: auto !important;
}

table input[type="text"] {
  display: inline;
  width: 50px;
  margin: 0 5px 5px 0;
  height: 23px;
  text-align: right;
}

table input[type="checkbox"] {
  display: inline;
  width: auto;
  height: auto;
  margin: 0 5px 2px 0;
}

.popup-inner {
  width: 360px;
}

.popup-inner .actions {
  justify-content: space-between;
}

input[type="file"] {
  display: none;
}
`];

customElements.define('beaker-resize-image', ResizeImagePopup);

/* globals monaco */

class EditorApp extends LitElement {
  static get properties () {
    return {
      url: {type: String},
      isUnloaded: {type: Boolean},
      isLoading: {type: Boolean},
      showLoadingNotice: {type: Boolean},
      isFilesOpen: {type: Boolean},
      readOnly: {type: Boolean},
      dne: {type: Boolean},
      isBinary: {type: Boolean}
    }
  }

  createRenderRoot () {
    return this // no shadow dom
  }

  get drive () {
    return beaker.hyperdrive.drive(this.url)
  }

  get origin () {
    let urlp = new URL(this.url);
    return urlp.origin + '/'
  }

  get viewedDatVersion () {
    let urlp = new URL(this.url);
    let parts = urlp.hostname.split('+');
    if (parts.length === 2) return parts[1]
    return 'latest'
  }

  get pathname () {
    let urlp = new URL(this.url);
    return urlp.pathname
  }

  get resolvedFilename () {
    return (this.resolvedPath || '').split('/').pop()
  }

  get resolvedUrl () {
    return this.origin + this.resolvedPath
  }

  get resolvedDirname () {
    return '/' + (this.resolvedPath || '').split('/').filter(Boolean).slice(0, -1).join('/')
  }

  get hasFileExt () {
    var path = this.pathname;
    return path.split('/').pop().includes('.')
  }

  get isPrivate () {
    return this.url.startsWith('hyper://private/')
  }

  get hasChanges () {
    var model = this.editor.getModel(this.url);
    return (
      typeof this.lastSavedVersionId !== 'undefined'
      && !!model
      && this.lastSavedVersionId !== model.getAlternativeVersionId()
    )
  }

  constructor () {
    super();
    beaker.panes.setAttachable();
    this.editorEl = undefined;
    this.editor = undefined; // monaco instance
    this.attachedPane = undefined;
    this.url = '';
    this.isUnloaded = true;
    this.stat = undefined;
    this.isLoading = false;
    this.showLoadingNotice = false;
    this.isFilesOpen = true;
    this.readOnly = true;
    this.lastSavedVersionId = undefined;
    this.dne = false;
    this.isBinary = false;
    this.resolvedPath = '';
    this.setFocusOnLoad = false;

    beaker.panes.addEventListener('pane-attached', e => {
      this.attachedPane = beaker.panes.getAttachedPane();
      this.requestUpdate();
      if (this.url !== this.attachedPane.url) {
        this.load(this.attachedPane.url);
      }
    });
    beaker.panes.addEventListener('pane-detached', e => {
      this.attachedPane = undefined;
      this.requestUpdate();
    });
    beaker.panes.addEventListener('pane-navigated', e => {
      if (!this.url || this.dne) {
        this.load(e.detail.url);
      }
    })

    ;(async () => {
      this.attachedPane = await beaker.panes.attachToLastActivePane();
      if (this.attachedPane) {
        this.load(this.attachedPane.url);
      } else {
        let ctx = (new URLSearchParams(location.search)).get('url');
        if (ctx) this.load(ctx);
      }
    })();
  }

  teardown () {
    if (this.editor) {
      this.editor.dispose();
    }
  }

  getContext () {
    return this.url
  }

  setFocus () {
    if (this.editor) {
      this.editor.focus();
    } else {
      this.setFocusOnLoad = true;
    }
  }

  ensureEditorEl () {
    if (!this.editorEl) {
      this.editorEl = document.createElement('div');
      this.editorEl.id = 'monaco-editor';
      this.editorEl.addEventListener('contextmenu', async e => {
        var choice = await beaker.browser.showContextMenu([
          {id: 'cut', label: 'Cut'},
          {id: 'copy', label: 'Copy'},
          {id: 'paste', label: 'Paste'},
          {type: 'separator'},
          {id: 'selectAll', label: 'Select All'},
          {type: 'separator'},
          {id: 'undo', label: 'Undo'},
          {id: 'redo', label: 'Redo'},
        ]);
        switch (choice) {
          case 'cut':
          case 'copy':
          case 'paste':
            this.editor.focus();
            document.execCommand(choice);
            break
          case 'selectAll':
            this.editor.setSelection(this.editor.getModel().getFullModelRange());
            break
          case 'undo':
          case 'redo':
            this.editor.trigger('contextmenu', choice);
            break
        }
      });
    }
    this.append(this.editorEl);
  }

  async createEditor () {
    this.ensureEditorEl();
    return new Promise((resolve, reject) => {
      window.require.config({ baseUrl: 'beaker://assets/' });
      window.require(['vs/editor/editor.main'], () => {
        // update monaco to syntax-highlight <script type="module">
        var jsLang = monaco.languages.getLanguages().find(lang => lang.id === 'javascript');
        if (jsLang) {
          jsLang.mimetypes.push('module');
          monaco.languages.register(jsLang);
        }


        // we have load monaco outside of the shadow dom
        monaco.editor.defineTheme('custom-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [{ background: '222222' }],
          colors: {
            'editor.background': '#222222'
          }
        });
        let opts = {
          automaticLayout: true,
          contextmenu: false,
          fixedOverflowWidgets: true,
          folding: false,
          lineNumbersMinChars: 4,
          links: false,
          minimap: {enabled: false},
          renderLineHighlight: 'all',
          roundedSelection: false,
          theme: 'custom-dark',
          value: ''
        };
        this.editor = monaco.editor.create(this.editorEl, opts);
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, function () {
          document.querySelector('editor-app').onClickSave();
        });
        resolve();
      });
    })
  }

  resetEditor () {
    for (let model of monaco.editor.getModels()) {
      model.dispose();
    }

    this.editor.setValue('');
    this.readOnly = true;
    this.dne = false;
    this.isBinary = false;
    this.resolvedPath = '';
    this.showLoadingNotice = true;
  }

  async load (url, forceLoad = false) {
    var release = await lock('editor-load');
    try {
      this.isUnloaded = false;
      this.isLoading = true;
      if (!this.editor) {
        await this.createEditor();
      }
      if (this.editor.hasTextFocus()) {
        this.setFocusOnLoad = true;
      }
      if (!forceLoad && (this.url === url || !url)) {
        this.isLoading = false;
        setTimeout(() => this.editor.focus(), 1);
        this.setFocusOnLoad = false;
        return
      }
      if (this.hasChanges) {
        if (!confirm('You have unsaved changes. Are you sure you want to navigate away?')) {
          this.isLoading = false;
          return
        }
      }
      this.url = url;
      history.replaceState({}, '', `/?url=${url}`);

      this.resetEditor();
      console.log('Loading', url);

      this.stat = undefined;
      var body = '';
      try {
        if (url.startsWith('hyper:')) {
          body = await this.loadDrive(url);
          this.isFilesOpen = !body;
        } else if (url.startsWith('http:') || url.startsWith('https:')) {
          this.isFilesOpen = false;
          body = await beaker.browser.fetchBody(url);
        } else {
          this.isFilesOpen = false;
          let res = await fetch(url);
          body = await res.text();
        }
      } catch (e) {
        this.dne = true;
        body = '';
      }

      if (!this.dne && !this.isBinary) {
        // create a model
        let urlp2 = new URL(url);
        urlp2.pathname = this.resolvedPath || this.pathname;
        let model = monaco.editor.createModel(body, null, url ? monaco.Uri.parse(urlp2.toString()) : undefined);

        // override the model syntax highlighting when the URL doesnt give enough info (no extension)
        if (body && model.getModeId() === 'plaintext') {
          let type = await beaker.browser.getResourceContentType(url);
          if (type) {
            if (type.includes('text/html')) {
              monaco.editor.setModelLanguage(model, 'html');
            } else if (type.includes('text/markdown')) {
              monaco.editor.setModelLanguage(model, 'markdown');
            } else if (type.includes('text/css')) {
              monaco.editor.setModelLanguage(model, 'css');
            } else if (type.includes('text/javascript') || type.includes('application/javascript')) {
              monaco.editor.setModelLanguage(model, 'javascript');
            }
          }
        }

        this.editor.updateOptions({
          // only enable autocomplete for html/css/js
          quickSuggestions: ['html', 'css', 'javascript'].includes(model.getModeId()),
          wordBasedSuggestions: false,
          wordWrap: 'on',
          readOnly: this.readOnly
        });
        model.updateOptions({tabSize: 2});
        this.editor.setModel(model);
        this.lastSavedVersionId = model.getAlternativeVersionId();

        model.onDidChangeContent(() => {
          this.setSaveBtnState();
        });
      }

      this.isLoading = false;
      this.showLoadingNotice = false;
      this.requestUpdate();

      if (this.setFocusOnLoad) {
        setTimeout(() => this.editor.focus(), 1);
        this.setFocusOnLoad = false;
      }
    } finally {
      release();
    }
  }

  async loadDrive (url) {
    var body;

    // load drive meta
    let drive = beaker.hyperdrive.drive(url);
    let [info, manifest] = await Promise.all([
      drive.getInfo(),
      drive.readFile('/index.json', 'utf8').catch(e => '')
    ]);
    try {
      manifest = JSON.parse(manifest);
    } catch (e) {
      console.debug('Failed to parse manifest', {e, manifest});
      manifest = null;
    }
    console.log(info);
    this.readOnly = !info.writable;

    // readonly if viewing historic version
    if (info.writable) {
      let v = this.viewedDatVersion;
      if (v == +v) { // viewing a numeric version? (in the history)
        this.readOnly = true;
      }
    }

    // determine the entry to load
    var entry = await datServeResolvePath(drive, manifest, url, '*/*');
    this.resolvedPath = entry ? entry.path : this.pathname;
    var stat = await drive.stat(this.resolvedPath);
    if (!stat.isFile()) throw new Error('Not a file')
    this.stat = stat;

    // check for mount information
    this.mountInfo = undefined;
    {
      let pathParts = this.resolvedPath.split('/').filter(Boolean);
      let realPathParts = [pathParts.pop()];
      while (pathParts.length) {
        let path = '/' + pathParts.join('/');
        let stat = await drive.stat(path).catch(e => undefined);
        if (stat && stat.mount) {
          this.mountInfo = await beaker.hyperdrive.drive(stat.mount.key).getInfo();
          this.mountInfo.resolvedPath = '/' + realPathParts.join('/');
          break
        }
        realPathParts.unshift(pathParts.pop());
      }
    }

    // figure out if it's binary
    {
      let filename = this.resolvedPath.split('/').pop();
      if (filename.includes('.') && isFilenameBinary(filename)) {
        this.isBinary = true;
      } else if (filename.endsWith('.goto')) {
        this.isBinary = true;
      }
    }

    // fetch the file
    if (!this.isBinary) {
      try {
        if (!this.resolvedPath) throw new Error('dne')
        body = await drive.readFile(this.resolvedPath, 'utf8');
      } catch (e) {
        this.dne = true;
        body = '';
      }
    }

    return body
  }

  loadExplorer () {
    try {
      this.querySelector('files-explorer').load();
    } catch (e) {
      console.warn(e);
    }
  }

  setSaveBtnState () {
    if (this.readOnly || this.dne || !this.hasChanges) {
      this.querySelector('#save-btn').setAttribute('disabled', '');
    } else {
      this.querySelector('#save-btn').removeAttribute('disabled');
    }
  }

  async showMenu (x, y, folderPath, item, folderItemUrls) {
    var items = [];
    if (item) {
      items.push({
        label: 'Open in New Tab',
        click () {
          beaker.browser.openUrl(item.url);
        }
      });
      items.push({
        label: 'Copy Link Address',
        disabled: !item.shareUrl,
        click () {
          writeToClipboard(item.shareUrl);
          create$1('Copied to your clipboard');
        }
      });
      if (item.stat.mount && item.stat.mount.key) {
        items.push({
          label: 'Copy Mount Target',
          click () {
            writeToClipboard(`hyper://${item.stat.mount.key}/`);
            create$1('Copied to your clipboard');
          }
        });
      }
      items.push({
        label: `Copy ${item.stat.isFile() ? 'file' : 'folder'} path`,
        click () {
          writeToClipboard(item.path);
          create$1('Copied to your clipboard');
        }
      });
      items.push({type: 'separator'});
      items.push({
        label: 'Open in Pane Right',
        click: () => {
          beaker.browser.newPane(item.shareUrl, {splitDir: 'vert'});
        }
      });
      items.push({
        label: 'Open in Pane Below',
        click: () => {
          beaker.browser.newPane(item.shareUrl, {splitDir: 'horz'});
        }
      });
      items.push({type: 'separator'});
      items.push({
        label: 'Rename',
        disabled: this.readOnly,
        click: () => this.onClickRename(item.path)
      });
      items.push({
        label: 'Delete',
        disabled: this.readOnly,
        click: () => this.onClickDelete(item.path)
      });
      items.push({type: 'separator'});
      items.push({
        label: 'Refresh Files',
        click: () => this.loadExplorer()
      });
      items.push({
        label: 'Export',
        click: () => this.onClickExportFiles([item.url])
      });
    } else {
      items.push({id: 'builtin:back'});
      items.push({id: 'builtin:forward'});
      items.push({id: 'builtin:reload'});
      items.push({type: 'separator'});
      items.push({id: 'builtin:split-pane-vert'});
      items.push({id: 'builtin:split-pane-horz'});
      items.push({id: 'builtin:move-pane'});
      items.push({id: 'builtin:close-pane'});
      items.push({type: 'separator'});
      items.push({
        label: 'New Folder',
        disabled: this.readOnly,
        click: () => this.onClickNewFolder(folderPath)
      });
      items.push({
        label: 'New File',
        disabled: this.readOnly,
        click: () => this.onClickNewFile(folderPath)
      });
      items.push({
        label: 'New Mount',
        disabled: this.readOnly,
        click: () => this.onClickNewMount(folderPath)
      });
      items.push({type: 'separator'});
      items.push({
        label: 'Refresh Files',
        click: () => this.loadExplorer()
      });
      items.push({type: 'separator'});
      items.push({
        label: 'Import File(s)',
        disabled: this.readOnly,
        click: () => this.onClickImportFiles(folderPath)
      });
      items.push({
        label: 'Import Folder(s)',
        disabled: this.readOnly,
        click: () => this.onClickImportFolders(folderPath)
      });
      items.push({
        label: 'Export Files',
        click: () => this.onClickExportFiles(folderItemUrls)
      });
    }
    items.push({type: 'separator'});
    items.push({id: 'builtin:inspect-element'});

    var fns = {};
    for (let i = 0; i < items.length; i++) {
      if (items[i].id) continue
      let id = `item=${i}`;
      items[i].id = id;
      fns[id] = items[i].click;
      delete items[i].click;
    }

    var choice = await beaker.browser.showContextMenu(items);
    if (fns[choice]) fns[choice]();
  }

  // rendering
  // =

  render () {
    if (this.isFilesOpen) {
      this.classList.add('files-open');
    } else {
      this.classList.remove('files-open');
    }
    return html`
      <link rel="stylesheet" href="beaker://assets/font-awesome.css">
      ${this.renderToolbar()}
      ${!this.isUnloaded && this.isFilesOpen ? html`
        <files-explorer
          url=${this.url}
          open-file-path=${this.resolvedPath}
          @open=${this.onOpenFile}
          @show-menu=${this.onShowMenu}
          @new-file=${this.onFilesExplorerNewFile}
        ></files-explorer>
      ` : ''}
      ${this.isBinary && this.pathname.endsWith('.goto') ? html`
        <div class="empty">
          .goto files store their information in
          <a href="#" @click=${e => {
            e.preventDefault();
            e.stopPropagation();
            this.querySelector('#file-metadata-btn').click();
          }}>file metadata</a>.
        </div>
      ` : this.isBinary ? html`
        <div class="empty">
          ${(/\.(png|jpe?g)$/.test(this.pathname)) ? html`
            <button class="primary btn" @click=${this.onClickResizeImage}>Resize Image</button>
          ` : 'This file is not editable here.'}
          <div class="binary-render">
            ${(/\.(png|jpe?g|gif)$/.test(this.pathname)) ? html`<img src="${this.url}?cache_buster=${Date.now()}">` : ''}
            ${(/\.(mp4|webm|mov)$/.test(this.pathname)) ? html`<video controls><source src="${this.url}?cache_buster=${Date.now()}"></video>` : ''}
            ${(/\.(mp3|ogg)$/.test(this.pathname)) ? html`<audio controls><source src="${this.url}?cache_buster=${Date.now()}"></audio>` : ''}
          </div>
        </div>
      ` : this.dne ? html`
        <div class="empty">
          <a @click=${e => { this.isFilesOpen = true; }}>Select a file</a>
          ${!this.readOnly ? html` or <a @click=${e => { this.onClickNewFile(this.resolvedDirname, this.resolvedFilename); }}>Create a file</a>` : ''}
        </div>
      ` : ''}
      ${this.showLoadingNotice ? html`<div id="loading-notice">Loading...</div>` : ''}
    `
  }

  updated (changedProperties) {
    this.ensureEditorEl();
    if (changedProperties.has('isFilesOpen')) {
      if (this.editor) {
        this.editor.layout();
      }
    }
  }

  renderToolbar () {
    return html`
      <div class="toolbar">
        <button class="transparent" @click=${this.onToggleFilesOpen} ?disabled=${this.isUnloaded}>
          <span class="fas fa-fw fa-columns"></span>
        </button>
        <span class="divider"></span>
        ${!this.readOnly ? html`
          <button id="save-btn" title="Save" @click=${this.onClickSave} ?disabled=${this.dne || !this.hasChanges}>
            <span class="fas fa-fw fa-save"></span> Save
          </button>
          <button title="Rename" @click=${e => this.onClickRename(this.resolvedPath)} ?disabled=${this.dne}>
            <span class="fas fa-fw fa-i-cursor"></span> Rename
          </button>
          <button title="Delete" @click=${e => this.onClickDelete(this.resolvedPath)} ?disabled=${this.dne}>
            <span class="far fa-fw fa-trash-alt"></span> Delete
          </button>
        ` : ''}
        <button title="Actions" @click=${this.onClickActions}>
          <span class="fas fa-fw fa-ellipsis-h"></span>
        </button>
        <span class="divider"></span>
        ${this.isLoading ? html`
          <div class="text"><span class="fas fa-fw fa-info-circle"></span> Loading...</div>
          <span class="divider"></span>
        ` : this.readOnly && !this.isUnloaded ? html`
          <div class="text"><span class="fas fa-fw fa-info-circle"></span> This site is read-only</div>
          <span class="divider"></span>
          ${this.mountInfo && this.mountInfo.writable ? html`
            <span style="margin-left: 8px">You own this file</span>
            <button class="primary" @click=${this.onClickEditReal}>
              Edit it in New Tab
            </button>
          ` : ''}
        ` : ''}
        <button id="file-metadata-btn" title="File Metadata" ?disabled=${!this.stat} @click=${this.onClickFileMetadata}>
          Metadata <span class="fas fa-fw fa-caret-down"></span>
        </button>
        <span class="divider"></span>
        <button title="View file" @click=${this.onClickView} ?disabled=${this.dne || this.isUnloaded}>
          <span class="far fa-fw fa-window-maximize"></span> View file
        </button>
        <span class="spacer"></span>
        ${this.attachedPane ? html`
          <button @click=${window.close}><span class="fas fa-times"></span></button>
        ` : ''}
      </div>
    `
  }

  // events
  // =

  onToggleFilesOpen (e) {
    this.isFilesOpen = !this.isFilesOpen;
  }

  onOpenFile (e) {
    if (this.hasChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to navigate away?')) {
        return
      }
    }
    this.load(e.detail.url);
  }

  onShowMenu (e) {
    this.showMenu(e.detail.x, e.detail.y, e.detail.folderPath, e.detail.item, e.detail.folderItemUrls);
  }

  onFilesExplorerNewFile (e) {
    this.onClickNewFile(e.detail.folderPath);
  }

  async onClickActions (e) {
    let el = e.currentTarget;
    if (el.classList.contains('active')) return
    e.preventDefault();
    e.stopPropagation();
    let rect = e.currentTarget.getClientRects()[0];
    el.classList.add('active');
    await create({
      x: (rect.left + rect.right) / 2,
      y: rect.bottom,
      center: true,
      fontAwesomeCSSUrl: 'beaker://assets/font-awesome.css',
      noBorders: true,
      roomy: true,
      rounded: true,
      style: 'padding: 4px 0',
      items: [
        {
          icon: 'fas fa-fw fa-file-export',
          label: 'Export',
          disabled: this.dne,
          click: () => this.onClickExportFiles(this.resolvedUrl)
        }
      ]
    });
    el.classList.remove('active');
  }

  onClickEditReal (e) {
    beaker.browser.openUrl(`beaker://editor?url=${this.mountInfo.url + this.mountInfo.resolvedPath}`, {
      setActive: true,
      adjacentActive: true
    });
  }

  async onClickFileMetadata (e) {
    let el = e.currentTarget;
    if (el.classList.contains('active')) return
    e.preventDefault();
    e.stopPropagation();
    let rect = e.currentTarget.getClientRects()[0];
    el.classList.add('active');
    await create({
      x: (rect.left + rect.right) / 2,
      y: rect.bottom,
      render: () => {
        var entries = Object.entries(this.stat.metadata).filter(([key]) => key !== 'type');
        if (!this.readOnly) entries = entries.concat([['', '']]);
        const onClickSaveMetadata = async (e) => {
          var metadataEl = e.currentTarget.parentNode;
          var newMetadata = {};
          for (let entryEl of Array.from(metadataEl.querySelectorAll('.entry'))) {
            let k = entryEl.querySelector('[name="key"]').value.trim();
            let v = entryEl.querySelector('[name="value"]').value.trim();
            if (k && v) newMetadata[k] = v;
          }
          var deletedKeys = [];
          for (let k in this.stat.metadata) {
            if (!(k in newMetadata)) deletedKeys.push(k);
          }
          await this.drive.updateMetadata(this.resolvedPath, newMetadata);
          if (deletedKeys.length) {
            await this.drive.deleteMetadata(this.resolvedPath, deletedKeys);
          }
          this.stat.metadata = newMetadata;
          destroy();
        };
        const onChange = e => {
          e.target.getRootNode().querySelector('button').removeAttribute('disabled');
        };
        return html`
          <link rel="stylesheet" href="beaker://assets/font-awesome.css">
          <style>
          .dropdown-items {
            padding: 12px;
            border: 0;
          }
          .metadata {
            position: relative;
            width: 100%;
          }
          .metadata .entry {
            display: flex;
            border: 1px solid #ccd;
            border-bottom: 0;
          }
          .metadata.readonly .entry:last-child {
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
            border-bottom: 1px solid #ccd;
            overflow: hidden;
          }
          .metadata input {
            box-sizing: border-box;
            border: 0;
            border-radius: 0;
            height: 22px;
            padding: 1px 4px 0 6px;
          }
          .metadata input[name="key"] {
            border-right: 1px solid #ccd;
            flex: 0 0 120px;
          }
          .metadata input[name="value"] {
            flex: 1;
            box-sizing: border-box;
          }
          button {
            display: block;
            width: 100%;
            cursor: pointer;
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
            padding: 5px 10px;
            outline: 0px;
            color: rgb(255, 255, 255);
            box-shadow: rgba(0, 0, 0, 0.1) 0px 1px 1px;
            background: rgb(82, 137, 247);
            border: 1px solid rgb(40, 100, 220);
          }
          button:disabled {
            background: #ddd;
            color: #aaa;
            border-color: #bbc;
          }
          button:disabled .fas {
            display: none;
          }
          </style>
          <div class="dropdown-items center rounded">
            <div class="metadata ${this.readOnly ? 'readonly' : ''}">
              ${repeat(entries, entry => `meta-${entry[0]}`, ([k, v]) => html`
                <div class="entry">
                  <input type="text" name="key" value=${k} ?disabled=${this.readOnly} placeholder="Key" @change=${onChange}>
                  <input type="text" name="value" value=${v} ?disabled=${this.readOnly} placeholder="Value" @change=${onChange}>
                </div>
              `)}
              ${this.readOnly && entries.length === 0 ? html`
                <div class="empty">No metadata</div>
              ` : ''}
              ${!this.readOnly ? html`
                <button class="primary" @click=${onClickSaveMetadata} disabled><span class="fas fa-fw fa-check"></span> Save</button>
              ` : ''}
            </div>
          </div>
        `
      }
    });
    el.classList.remove('active');
  }

  async onClickResizeImage (e) {
    e.preventDefault();
    var dataUrl = await ResizeImagePopup.create(this.url);
    var base64buf = dataUrl.split(',').pop();
    await this.drive.writeFile(this.resolvedPath, base64buf, 'base64');
  }

  async onClickView () {
    this.attachedPane = beaker.panes.getAttachedPane();
    if (!this.attachedPane) {
      this.attachedPane = await beaker.panes.create(this.url, {attach: true});
    } else {
      beaker.panes.navigate(this.attachedPane.id, this.url);
    }
  }

  async onClickSave () {
    if (this.readOnly) return
    var model = this.editor.getModel(this.url);
    let st = await this.drive.stat(this.resolvedPath).catch(e => undefined);
    let metadata = st && st.metadata ? st.metadata : undefined;
    await this.drive.writeFile(this.resolvedPath, model.getValue(), {metadata});
    this.lastSavedVersionId = model.getAlternativeVersionId();
    if (this.attachedPane) {
      this.attachedPane = beaker.panes.getAttachedPane();
      beaker.panes.navigate(this.attachedPane.id, this.attachedPane.url);
    }
    this.setSaveBtnState();
    this.setFocus();
  }

  async onClickRename (oldpath) {
    if (this.readOnly) return
    var folderPath = oldpath.split('/').slice(0, -1).join('/');
    var oldname = oldpath.split('/').pop();
    var newname = prompt('Enter the new name of this file', oldname);
    if (!newname) return
    var newpath = joinPath(folderPath, newname);
    await this.drive.rename(oldpath, newpath);

    this.loadExplorer();
    if (this.resolvedPath === oldpath) {
      let oldurl = this.url;
      let urlp = new URL(this.url);
      urlp.pathname = newpath;
      this.load(urlp.toString());
      if (this.attachedPane) {
        this.attachedPane = beaker.panes.getAttachedPane();
        if (this.attachedPane.url === oldurl) {
          beaker.panes.navigate(this.attachedPane.id, urlp.toString());
        }
      }
    }
  }

  async onClickDelete (path) {
    if (this.readOnly) return
    if (confirm('Are you sure you want to delete this file?')) {
      let st = await this.drive.stat(path);
      if (st.mount && st.mount.key) {
        await this.drive.unmount(path);
      } else if (st.isDirectory()) {
        await this.drive.rmdir(path, {recursive: true});
      } else {
        await this.drive.unlink(path);
      }

      this.loadExplorer();
      if (this.attachedPane) {
        this.attachedPane = beaker.panes.getAttachedPane();
        if (this.attachedPane.url === this.url) {
          beaker.panes.navigate(this.attachedPane.id, this.url);
        }
      }
      if (this.resolvedPath === path) {
        this.load(this.url);
      }
    }
  }

  async onClickNewFolder (folderPath) {
    if (this.readOnly) return
    var name = prompt('Enter the new folder name');
    if (name) {
      let path = joinPath(folderPath, name);
      await this.drive.mkdir(path);
      this.loadExplorer();
    }
  }

  async onClickNewFile (folderPath, defaultName = '') {
    if (this.readOnly) return
    var name = prompt('Enter the new file name', defaultName);
    if (name) {
      let path = joinPath(folderPath, name);
      await this.drive.writeFile(path, '');
      this.loadExplorer();
      this.load(joinPath(this.drive.url, path), true);
    }
  }

  async onClickNewMount (folderPath) {
    if (this.readOnly) return
    var url = await beaker.shell.selectDriveDialog();
    if (!url) return
    var name = await prompt('Enter the new mount name');
    if (!name) return
    await this.drive.mount(joinPath(folderPath, name), url);
    this.loadExplorer();
  }

  async onClickImportFiles (folderPath) {
    create$1('Importing...');
    try {
      var {numImported} = await beaker.shell.importFilesDialog(joinPath(this.drive.url, folderPath));
      if (numImported > 0) create$1('Import complete', 'success');
      else destroy$1();
    } catch (e) {
      console.log(e);
      create$1(e.toString(), 'error');
    }
    this.loadExplorer();
  }

  async onClickImportFolders (folderPath) {
    create$1('Importing...');
    try {
      var {numImported} = await beaker.shell.importFoldersDialog(joinPath(this.drive.url, folderPath));
      if (numImported > 0) create$1('Import complete', 'success');
      else destroy$1();
    } catch (e) {
      console.log(e);
      create$1(e.toString(), 'error');
    }
    this.loadExplorer();
  }

  async onClickExportFiles (urls) {
    create$1('Exporting...');
    try {
      var {numExported} = await beaker.shell.exportFilesDialog(urls);
      if (numExported > 0) create$1('Export complete', 'success');
      else destroy$1();
    } catch (e) {
      console.log(e);
      create$1(e.toString(), 'error');
    }
  }

  async onClickFork (e) {
    var urlp = new URL(this.url);
    var newDrive = await beaker.hyperdrive.forkDrive(this.url);
    var newDriveUrlp = new URL(newDrive.url);
    urlp.hostname = newDriveUrlp.hostname;
    
    beaker.browser.gotoUrl(urlp.toString());
    this.load(urlp.toString());
  }
}

customElements.define('editor-app', EditorApp);

},{"@beaker/dat-serve-resolve-path":2,"await-lock":3}],2:[function(require,module,exports){
const {join} = require('path')
const parseDatUrl = require('parse-dat-url')

/**
 * @description
 * For a given HTTP accept header, provide a list of file-extensions to try.
 * @param {string | undefined} accept
 * @returns {string[]}
 */
function acceptHeaderExtensions (accept) {
  var exts = []
  var parts = (accept || '').split(',')
  if (parts.includes('text/html') || (parts.length === 1 && parts[0] === '*/*')) exts = exts.concat(['.html', '.md'])
  if (parts.includes('text/css')) exts.push('.css')
  if (parts.includes('image/*') || parts.includes('image/apng')) exts = exts.concat(['.png', '.jpg', '.jpeg', '.gif'])
  return exts
}

/**
 * @description
 * For a given archive, dat.json, request url, and request Accept header, find the file to serve
 * @param {Object} archive the dat archive to read from
 * @param {Object|undefined} manifest the dat archive's dat.json manifest
 * @param {string|Object} url the request URL (can be pre-parsed by parse-dat-url)
 * @param {string} acceptHeader the request Accept header
 * @returns {Promise<Object>} returns the Stat object with .path added
 */
module.exports = async function (archive, manifest, url, acceptHeader) {
  // parse path
  var urlp = typeof url === 'string' ? parseDatUrl(url, true) : url
  var filepath = decodeURIComponent(urlp.path)
  if (!filepath) filepath = '/'
  if (filepath.indexOf('?') !== -1) filepath = filepath.slice(0, filepath.indexOf('?')) // strip off any query params
  var hasTrailingSlash = filepath.endsWith('/')

  // lookup entry
  var entry
  const tryStat = async (path) => {
    // abort if we've already found it
    if (entry) return
    // apply the web_root config
    if (manifest && manifest.web_root && !urlp.query.disable_web_root) {
      if (path) {
        path = join(manifest.web_root, path)
      } else {
        path = manifest.web_root
      }
    }
    // attempt lookup
    try {
      entry = await archive.stat(path)
      entry.path = path
    } catch (e) {}
  }

  // do lookup
  if (hasTrailingSlash) {
    await tryStat(filepath + 'index.html')
    await tryStat(filepath + 'index.md')
    await tryStat(filepath)
  } else {
    await tryStat(filepath)
    for (let ext of acceptHeaderExtensions(acceptHeader)) {
      // fallback to different requested headers
      await tryStat(filepath + ext)
    }
    if (entry && entry.isDirectory()) {
      // unexpected directory, give the .html fallback a chance
      let dirEntry = entry
      entry = null
      await tryStat(filepath + '.html') // fallback to .html
      if (dirEntry && !entry) {
        // no .html fallback found, stick with directory that we found
        entry = dirEntry
      }
    }
  }

  // check for a fallback page
  const useFallback = Boolean(manifest && manifest.fallback_page && !urlp.query.disable_fallback_page)
  if (useFallback && (!entry || entry.isDirectory())) {
    let tmp = entry; entry = null
    await tryStat(manifest.fallback_page)
    if (!entry) entry = tmp
  }

  return entry
}
},{"parse-dat-url":4,"path":10}],3:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const assert_1 = __importDefault(require("assert"));
/**
 * A mutex lock for coordination across async functions
 */
class AwaitLock {
    constructor() {
        this._acquired = false;
        this._waitingResolvers = [];
    }
    /**
     * Acquires the lock, waiting if necessary for it to become free if it is already locked. The
     * returned promise is fulfilled once the lock is acquired.
     *
     * After acquiring the lock, you **must** call `release` when you are done with it.
     */
    acquireAsync() {
        if (!this._acquired) {
            this._acquired = true;
            return Promise.resolve();
        }
        return new Promise(resolve => {
            this._waitingResolvers.push(resolve);
        });
    }
    /**
     * Acquires the lock if it is free and otherwise returns immediately without waiting. Returns
     * `true` if the lock was free and is now acquired, and `false` otherwise
     */
    tryAcquire() {
        if (!this._acquired) {
            this._acquired = true;
            return true;
        }
        return false;
    }
    /**
     * Releases the lock and gives it to the next waiting acquirer, if there is one. Each acquirer
     * must release the lock exactly once.
     */
    release() {
        assert_1.default(this._acquired, 'Trying to release an unacquired lock');
        if (this._waitingResolvers.length > 0) {
            let resolve = this._waitingResolvers.shift();
            resolve();
        }
        else {
            this._acquired = false;
        }
    }
}
module.exports = AwaitLock;
module.exports.default = AwaitLock;
Object.defineProperty(module.exports, "__esModule", { value: true });

},{"assert":5}],4:[function(require,module,exports){
const isNode = typeof window === 'undefined'
const parse = isNode ? require('url').parse : browserParse

const SCHEME_REGEX = /[a-z]+:\/\//i
//                   1          2      3        4
const VERSION_REGEX = /^(dat:\/\/)?([^/]+)(\+[^/]+)(.*)$/i

module.exports = function parseDatURL (str, parseQS) {
  // prepend the scheme if it's missing
  if (!SCHEME_REGEX.test(str)) {
    str = 'dat://' + str
  }

  var parsed, version = null, match = VERSION_REGEX.exec(str)
  if (match) {
    // run typical parse with version segment removed
    parsed = parse((match[1] || '') + (match[2] || '') + (match[4] || ''), parseQS)
    version = match[3].slice(1)
  } else {
    parsed = parse(str, parseQS)
  }
  if (isNode) parsed.href = str // overwrite href to include actual original
  else parsed.path = parsed.pathname // to match node
  if (!parsed.query && parsed.searchParams) {
    parsed.query = Object.fromEntries(parsed.searchParams) // to match node
  }
  parsed.version = version // add version segment
  return parsed
}

function browserParse (str) {
  return new URL(str)
}
},{"url":16}],5:[function(require,module,exports){
(function (global){(function (){
'use strict';

var objectAssign = require('object-assign');

// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
// original notice:

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
function isBuffer(b) {
  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
    return global.Buffer.isBuffer(b);
  }
  return !!(b != null && b._isBuffer);
}

// based on node assert, original notice:
// NB: The URL to the CommonJS spec is kept just for tradition.
//     node-assert has evolved a lot since then, both in API and behavior.

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = require('util/');
var hasOwn = Object.prototype.hasOwnProperty;
var pSlice = Array.prototype.slice;
var functionsHaveNames = (function () {
  return function foo() {}.name === 'foo';
}());
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer(arrbuf)) {
    return false;
  }
  if (typeof global.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!util.isFunction(func)) {
    return;
  }
  if (functionsHaveNames) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect(something) {
  if (functionsHaveNames || !util.isFunction(something)) {
    return util.inspect(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
  }
};

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer(actual) && isBuffer(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer(actual) !== isBuffer(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && util.isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
};

assert.ifError = function(err) { if (err) throw err; };

// Expose a strict only variant of assert
function strict(value, message) {
  if (!value) fail(value, true, message, '==', strict);
}
assert.strict = objectAssign(strict, assert, {
  equal: assert.strictEqual,
  deepEqual: assert.deepStrictEqual,
  notEqual: assert.notStrictEqual,
  notDeepEqual: assert.notDeepStrictEqual
});
assert.strict.strict = assert.strict;

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"object-assign":9,"util/":8}],6:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],7:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],8:[function(require,module,exports){
(function (process,global){(function (){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":7,"_process":11,"inherits":6}],9:[function(require,module,exports){
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

'use strict';
/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],10:[function(require,module,exports){
(function (process){(function (){
// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this)}).call(this,require('_process'))
},{"_process":11}],11:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],12:[function(require,module,exports){
(function (global){(function (){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],13:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],14:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],15:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":13,"./encode":14}],16:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":17,"punycode":12,"querystring":15}],17:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}]},{},[1]);
