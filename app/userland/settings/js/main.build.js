(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

require('lodash.debounce');

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

function setParams (kv, clear = false, replaceState = false) {
  var url = (new URL(window.location));
  if (clear) url.search = '';
  for (var k in kv) {
    if (kv[k]) {
      url.searchParams.set(k, kv[k]);
    } else {
      url.searchParams.delete(k);
    }
  }
  if (replaceState) {
    window.history.replaceState({}, null, url);
  } else {
    window.history.pushState({}, null, url);
  }
}

function getParam (k, fallback = '') {
  return (new URL(window.location)).searchParams.get(k) || fallback
}

const cssStr = css`
*,
*:before,
*:after {
  box-sizing: border-box;
}

body {
  margin: 0;
}

a {
  text-decoration: none;
  color: inherit;
}

button {
  background: none;
  outline-color: transparent;
  border: none;
}

`;

const cssStr$1 = css`
body {
  --system-font: -apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", Ubuntu, Cantarell, "Oxygen Sans", "Helvetica Neue", sans-serif;
  --code-font: Consolas, 'Lucida Console', Monaco, monospace;
}

body {
  font-family: var(--system-font);
}

code {
  font-family: var(--code-font);
  font-style: normal;
}

`;

const cssStr$2 = css`
body {
  --blue: #2864dc; /* this is a leftover that ought to get replaced */
  --border-color--default: #bbc;
  --border-color--light: #ccd;
  --border-color--dark: #99a;
  --border-color--semi-light: #dde;
  --border-color--very-light: #eef;
  --border-color--private-light: #b7c7b0;
  --border-color--unread: #9497f5;
  --text-color--default: #333;
  --text-color--lightish: #555;
  --text-color--light: #667;
  --text-color--pretty-light: #889;
  --text-color--very-light: #bbc;
  --text-color--link: #4040e7;
  --text-color--result-link: blue;
  --text-color--markdown-link: #4040e7;
  --text-color--private-default: #518680;
  --text-color--private-link: #02796d;
  --bg-color--default: #fff;
  --bg-color--secondary: #fafafd;
  --bg-color--light: #fafafd;
  --bg-color--semi-light: #f0f0f6;
  --bg-color--private-light: #f5faf7;
  --bg-color--private-semi-light: #edf6f1;
  --bg-color--light-highlight: #f7faff;
  --bg-color--unread: #f2f3ff;
}

@media (prefers-color-scheme: dark) {
  body {
    --border-color--default: #666;
    --border-color--light: #555;
    --border-color--dark: #888;
    --border-color--semi-light: #444;
    --border-color--very-light: #333;
    --border-color--private-light: #3a5a4c;
    --border-color--unread: #9497f5;
    --text-color--default: #ccc;
    --text-color--lightish: #bbb;
    --text-color--light: #aaa;
    --text-color--pretty-light: #999;
    --text-color--very-light: #555;
    --text-color--link: #5d80ff;
    --text-color--result-link: #587bfb;
    --text-color--markdown-link: #5d80ff;
    --text-color--private-default: #69a59e;
    --text-color--private-link: #04a294;
    --bg-color--default: #222;
    --bg-color--secondary: #1b1b1b;
    --bg-color--light: #333;
    --bg-color--semi-light: #444;
    --bg-color--private-light: #202f2f;
    --bg-color--private-semi-light: #354a48;
    --bg-color--light-highlight: #3e3e3a;
    --bg-color--selected: var(--text-color--link);
    --bg-color--unread: #333658;
  }
}
`;

const cssStr$3 = css`
${cssStr}
${cssStr$2}

.link {
  color: var(--blue);
}

.link:hover {
  text-decoration: underline;
}

.btn.nofocus,
.btn[disabled="disabled"],
.btn.disabled,
.btn:disabled {
  outline: 0;
  box-shadow: none;
}

.btn {
  display: inline-block;
  height: 30px;
  padding: 0 10px;
  border: 1px solid #ddd;
  background: #fafafa;
  border-radius: 2px;
  color: var(--text-color--default);
  font-size: 13px;
  line-height: 26px;
  letter-spacing: 0.25px;
  font-weight: 400;
  cursor: pointer;
  text-decoration: none;
}

.btn.small {
  height: 24px;
  line-height: 20px;
}

.btn.small * {
  vertical-align: top;
  line-height: 20px;
}

.btn.plain {
  background: none;
  border: none;
  color: var(--text-color--pretty-light);
  line-height: 28px;
  padding: 0 3px;
}

.btn.plain:hover {
  color: var(--color-text);
  background: none;
}

.btn.plain:focus {
  box-shadow: none;
}

.btn i {
  line-height: 100%;
  line-height: 30px;
  vertical-align: middle;
}

.btn i:last-child {
  margin-left: 2px;
  margin-right: 0;
}

.btn i:first-child {
  margin-left: 0;
  margin-right: 2px;
}

.btn i:first-child:last-child {
  margin-left: 0;
  margin-right: 0;
}

.btn:focus {
  outline: none;
}

.btn.full-width {
  width: 100%;
}

.btn.center {
  text-align: center;
}

.btn.thick {
  font-size: 14px;
  font-weight: normal;
  height: 35px;
  line-height: 32px;
  padding: 0 12px;
}

.btn.pressed {
  box-shadow: inset 0px 0 5px rgba(0, 0, 0, 0.1);
  background: linear-gradient(to top, #ddd, #ccc);
}

.btn.pressed:hover {
  box-shadow: inset 0px 0 2px rgba(0, 0, 0, 0.1);
  background: linear-gradient(to top, #ddd, #ccc);
  cursor: default;
}

.btn:hover {
  text-decoration: none;
  background: #eee;
}

.btn[disabled="disabled"],
.btn.disabled,
.btn:disabled {
  cursor: default !important;
  background: #fafafa !important;
  color: rgba(0, 0, 0, 0.4) !important;
  border: 1px solid #eee !important;
  font-weight: 400 !important;
  -webkit-font-smoothing: initial !important;
}

.btn[disabled="disabled"] .spinner,
.btn.disabled .spinner,
.btn:disabled .spinner {
  color: #aaa !important;
}

.btn[disabled="disabled"]:hover,
.btn.disabled:hover,
.btn:disabled:hover {
  background: #fafafa;
}

.btn[disabled="disabled"] *,
.btn.disabled *,
.btn:disabled * {
  cursor: default !important;
}

.btn .spinner {
  display: inline-block;
  position: relative;
  top: 1px;
  color: inherit;
}

.btn.warning {
  color: #fff;
  background: #cc2f26;
  border-color: #cc2f26;
}

.btn.warning.pressed,
.btn.warning:hover {
  background: #c42d25;
  border-color: #c42d25;
}

.btn.success {
  background: #41bb56;
  color: #fff;
  border-color: #41bb56;
}

.btn.success.pressed,
.btn.success:hover {
  background: #3baa4e;
  border-color: #3baa4e;
}

.btn.transparent {
  border-color: transparent;
  background: none;
  font-weight: 400;
}

.btn.transparent:hover {
  background: rgba(0, 0, 0, 0.075);
  color: #424242;
}

.btn.transparent.disabled {
  border-color: transparent !important;
  background: none !important;
}

.btn.transparent.pressed {
  background: linear-gradient(to top, #f5f3f3, #ececec);
  border-color: #dadada;
}

.btn.primary {
  background: #2864dc;
  color: #fff;
  border: 1px solid #2864dc;
  transition: background 0.1s ease;
}

.btn.primary.pressed {
  box-shadow: inset 0px 0 5px rgba(0, 0, 0, 0.25);
}

.btn.primary:hover {
  background: #2357bf;
}

.btn.nofocus:focus,
button.nofocus:focus {
  outline: 0;
  box-shadow: none;
}

`;

const cssStr$4 = css`
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

const cssStr$5 = css`
${cssStr}
${cssStr$1}
${cssStr$3}
${cssStr$4}

body {
  background: #f5f5f7;
  color: #333;
}
`;

const cssStr$6 = css`
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

const cssStr$7 = css`
.empty {
  background: var(--bg-color--light);
  padding: 20px;
  text-align: center;
  color: var(--text-color--light);
  font-size: 16px;
  line-height: 2;
  box-sizing: content-box;
}
`;

const cssStr$8 = css`
${cssStr$5}
${cssStr$6}
${cssStr$7}

:host {
  display: block;
  margin: 10px 10px 10px 230px;
}

.subnav {
  position: fixed;
  left: 10px;
  top: 10px;
  width: 190px;
  height: calc(100vh - 20px);
  box-sizing: border-box;
  background: var(--bg-color--light);
  border-radius: 8px;
  padding: 10px 0;
  overflow-y: auto;
  font-size: 12px;
  user-select: none;
}

.subview {

}

.subnav .item {
  padding: 8px 15px;
  margin-bottom: 2px;
  color: var(--text-color--subnav-item);
  text-decoration: none;
  box-sizing: border-box;
  cursor: pointer;
}

.subnav .item .fa-fw {
  margin-right: 5px;
}

.subnav .item:hover {
  background: var(--bg-color--subnav-item--hover);
}

.subnav .item.current {
  background: var(--bg-color--subnav-item--current);
  font-weight: 600;
}

.subnav hr {
  border: 0;
  border-top: 1px solid var(--border-color--light);
  margin: 15px 0;
}
`;

const cssStr$9 = css`
*[data-tooltip] {
  position: relative;
}

*[data-tooltip]:hover:before,
*[data-tooltip]:hover:after {
  display: block;
  z-index: 1000;
  transition: opacity 0.01s ease;
  transition-delay: 0.2s;
}

*[data-tooltip]:hover:after {
  opacity: 1;
}

*[data-tooltip]:hover:before {
  transform: translate(-50%, 0);
  opacity: 1;
}

*[data-tooltip]:before {
  opacity: 0;
  transform: translate(-50%, 0);
  position: absolute;
  top: 33px;
  left: 50%;
  z-index: 3000;
  content: attr(data-tooltip);
  background: rgba(17, 17, 17, 0.95);
  font-size: 0.7rem;
  border: 0;
  border-radius: 4px;
  padding: 7px 10px;
  color: rgba(255, 255, 255, 0.925);
  text-transform: none;
  text-align: center;
  font-weight: 500;
  white-space: pre;
  line-height: 1;
  pointer-events: none;
}

*[data-tooltip]:after {
  opacity: 0;
  position: absolute;
  left: calc(50% - 6px);
  top: 28px;
  content: '';
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid rgba(17, 17, 17, 0.95);
  pointer-events: none;
}

.tooltip-nodelay[data-tooltip]:hover:before,
.tooltip-nodelay[data-tooltip]:hover:after {
  transition-delay: initial;
}

.tooltip-right[data-tooltip]:before {
  top: 50%;
  left: calc(100% + 6px);
  transform: translate(0, -50%);
  line-height: 0.9;
}

.tooltip-right[data-tooltip]:after {
  top: 50%;
  left: calc(100% + 0px);
  transform: translate(0, -50%);
  border: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right: 6px solid rgba(17, 17, 17, 0.95);
}

.tooltip-left[data-tooltip]:before {
  top: 50%;
  left: auto;
  right: calc(100% + 6px);
  transform: translate(0, -50%);
  line-height: 0.9;
}

.tooltip-left[data-tooltip]:after {
  top: 50%;
  left: auto;
  right: calc(100% + 0px);
  transform: translate(0, -50%);
  border: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-left: 6px solid rgba(17, 17, 17, 0.95);
}

.tooltip-top[data-tooltip]:before {
  top: unset;
  bottom: 33px;
}

.tooltip-top[data-tooltip]:after {
  top: unset;
  bottom: 28px;
  border: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid rgba(17, 17, 17, 0.95);
}
`;

const cssStr$a = css`
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

const cssStr$b = css`
${cssStr$2}
${cssStr$6}
${cssStr$9}
${cssStr$a}

:host {
  display: block;
  max-width: 600px;
}

a {
  color: var(--blue);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.section {
  margin-bottom: 30px;
}

.section.warning {
  color: red;
  background: #ffdddd;
  border: 1px solid transparent;
  padding: 0 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.section.warning button {
  color: rgb(255, 255, 255);
  background: rgb(255, 59, 48);
  border: 0;
}

.section.warning button .spinner {
  border-color: #fff !important;
  border-right-color: transparent !important;
}

.form-group {
  border: 1px solid var(--border-color--semi-light);
  border-radius: 4px;
  padding: 10px 12px;
  margin-bottom: 16px;
}

.form-group .section {
  margin-bottom: 0;
  padding: 0 10px 4px;
}

.form-group .section:not(:last-child) {
  margin-bottom: 0;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color--semi-light);
}

.form-group .section > :first-child {
  margin-top: 16px;
}

.form-group h2 {
  margin: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color--semi-light);
}

.message {
  margin: 1em 0;
  background: var(--bg-color--message);
  padding: 10px;
  border-radius: 2px;
}

.message > :first-child {
  margin-top: 0;
}

.message > :last-child {
  margin-bottom: 0;
}

input[type="text"], input[type="url"] {
  height: 24px;
  padding: 0 7px;
  border-radius: 4px;
  color: rgba(51, 51, 51, 0.95);
  border: 1px solid #d9d9d9;
  box-shadow: inset 0 1px 2px #0001;
}

input[type="text"]:focus, input[type="url"]:focus {
  outline: 0;
  border: 1px solid rgba(41, 95, 203, 0.8);
  box-shadow: 0 0 0 2px rgba(41, 95, 203, 0.2);
}

input[type="radio"] {
  margin: 1px 7px 0 1px;
}

input[type="checkbox"] {
  margin: 1px 7px 0 1px;
}

.radio-item {
  display: flex;
  align-items: center;
}

.radio-item + .radio-item {
  margin-top: 4px;
}

.versions {
  font-size: 13px;
  background: var(--bg-color--message);
  margin-top: -10px;
  padding: 12px 35px;
  border-radius: 4px;
  line-height: 1.4;
}

.versions ul {
  padding-inline-start: 15px;
}

.versions strong {
  font-weight: 600;
}

.version-info .spinner {
  position: relative;
  top: 4px;
  margin: 0 4px 0 6px;
}

.search-settings-list {
  margin-bottom: 10px;
}

.search-settings-list a {
  color: gray;
  cursor: pointer;
}

`;

const cssStr$c = css`
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

function create (message, type = '', time = 5000, button = null) {
  // destroy existing
  destroy();

  // render toast
  document.body.appendChild(new BeakerToast({message, type, button}));
  setTimeout(destroy, time);
}

function destroy () {
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
    const onButtonClick = this.button ? (e) => { destroy(); this.button.click(e); } : undefined;
    return html`
    <div id="toast-wrapper" class="toast-wrapper ${this.button ? '' : 'nomouse'}">
      <p class="toast ${this.type}">${this.message} ${this.button ? html`<a class="toast-btn" @click=${onButtonClick}>${this.button.label}</a>` : ''}</p>
    </div>
    `
  }
}
BeakerToast.styles = cssStr$c;

customElements.define('beaker-toast', BeakerToast);

class GeneralSettingsView extends LitElement {
  static get properties () {
    return {
    }
  }

  static get styles () {
    return cssStr$b
  }

  constructor () {
    super();
    this.browserEvents = undefined;
    this.settings = undefined;
    this.browserInfo = undefined;
    this.defaultProtocolSettings = undefined;
    this.listingSelfState = undefined;
  }

  get isAutoUpdateEnabled () {
    return this.settings && ((+this.settings.auto_update_enabled) === 1)
  }

  async load () {
    // wire up events
    this.browserEvents = beaker.browser.createEventsStream();
    this.browserEvents.addEventListener('updater-state-changed', this.onUpdaterStateChanged.bind(this));
    this.browserEvents.addEventListener('updater-error', this.onUpdaterError.bind(this));

    // fetch data
    this.browserInfo = await beaker.browser.getInfo();
    this.settings = await beaker.browser.getSettings();
    this.defaultProtocolSettings = await beaker.browser.getDefaultProtocolSettings();
    console.log('loaded', {
      browserInfo: this.browserInfo,
      settings: this.settings,
      defaultProtocolSettings: this.defaultProtocolSettings
    });
    this.requestUpdate();

    this.requestUpdate();
  }

  unload () {
    this.browserEvents.close();
  }

  // rendering
  // =

  render () {
    if (!this.browserInfo) return html``
    return html`
      <link rel="stylesheet" href="beaker://assets/font-awesome.css">
      ${this.renderDaemonStatus()}
      <div class="form-group">
        <h2>Auto Updater</h2>
        ${this.renderAutoUpdater()}
      </div>
      <div class="form-group">
        <h2>Tab Settings</h2>
        ${this.renderOnStartupSettings()}
        ${this.renderNewTabSettings()}
        ${this.renderTabSettings()}
        ${this.renderDefaultZoomSettings()}
      </div>
      <div class="form-group">
        <h2>Browser Settings</h2>
        ${this.renderRunBackgroundSettings()}
        ${this.renderProtocolSettings()}
        ${this.renderThemeSettings()}
      </div>
      <div class="form-group">
        <h2>Search Settings</h2>
        ${this.renderSearchSettings()}
      </div>
      <div class="form-group">
        <h2>Beaker Analytics</h2>
        ${this.renderAnalyticsSettings()}
      </div>
    `
  }

  renderDaemonStatus () {
    if (this.browserInfo && !this.browserInfo.isDaemonActive) {
      return html`
        <div class="section warning">
          <h2><span class="fas fa-exclamation-triangle"></span> The Hyperdrive Daemon is Not Active</h2>
          <p>
            The "daemon" runs Beaker's Hyperdrive networking.
          </p>
          <p>
            <button @click=${this.onClickRestartDaemon}>Restart the Daemon</button>
          </p>
        </div>
      `
    }
  }

  renderAutoUpdater () {
    if (this.browserInfo && !this.browserInfo.updater.isBrowserUpdatesSupported) {
      return html`
        <div class="section">
          <p class="message info">
            Sorry! Beaker auto-updates are only supported on the production build for macOS and Windows.
          </p>

          <p>
            To get the most recent version of Beaker, you'll need to <a href="https://github.com/beakerbrowser/beaker">
            build Beaker from source</a>.
          </p>
        </div>
      `
    }

    switch (this.browserInfo.updater.state) {
      default:
      case 'idle':
        return html`
        <div class="section">
          <h2 id="auto-updater">
            Auto Updater
          </h2>

          ${this.browserInfo.updater.error ? html`
            <div class="message error">
              <i class="fa fa-exclamation-triangle"></i>
              ${this.browserInfo.updater.error}
            </div>
          ` : ''}

          <div class="auto-updater">
            <p>
              <button class="btn btn-default" @click=${this.onClickCheckUpdates}>Check for updates</button>

              <span class="up-to-date">
                <span class="fa fa-check"></span>
                Beaker v${this.browserInfo.version} is up-to-date
              </span>
            </p>

            <p>
              ${this.renderAutoUpdateCheckbox()}
            </p>

            <div class="prereleases">
              <h3>Advanced</h3>
              <button class="btn" @click=${this.onClickCheckPrereleases}>
                Check for beta releases
              </button>
            </div>
          </div>
        </div>`

      case 'checking':
        return html`
        <div class="section">
          <h2 id="auto-updater">
            Auto Updater
          </h2>

          <div class="auto-updater">
            <p>
              <button class="btn" disabled>Checking for updates</button>
              <span class="version-info">
                <div class="spinner"></div>
                Checking for updates...
              </span>
            </p>

            <p>
              ${this.renderAutoUpdateCheckbox()}
            </p>

            <div class="prereleases">
              <h3>Advanced</h3>
              <button class="btn" @click=${this.onClickCheckPrereleases}>
                Check for beta releases
              </button>
            </div>
          </div>
        </div>`

      case 'downloading':
        return html`
        <div class="section">
          <h2 id="auto-updater">Auto Updater</h2>

          <div class="auto-updater">
            <p>
              <button class="btn" disabled>Updating</button>
              <span class="version-info">
                <span class="spinner"></span>
                Downloading the latest version of Beaker...
              </span>
            </p>
            <p>
              ${this.renderAutoUpdateCheckbox()}
            </p>
          </div>
        </div>`

      case 'downloaded':
        return html`
        <div class="section">
          <h2 id="auto-updater">Auto Updater</h2>

          <div class="auto-updater">
            <p>
              <button class="btn" @click=${this.onClickRestart}>Restart now</button>
              <span class="version-info">
                <i class="fa fa-arrow-circle-o-up"></i>
                <strong>New version available.</strong> Restart Beaker to install.
              </span>
            </p>
            <p>
              ${this.renderAutoUpdateCheckbox()}
            </p>
          </div>
        </div>`
    }
  }

  renderAutoUpdateCheckbox () {
    return html`<label>
      <input type="checkbox" ?checked=${this.isAutoUpdateEnabled} @click=${this.onToggleAutoUpdate} /> Check for updates automatically
    </label>`
  }

  renderTabSettings () {
    return html`
      <div class="section">
        <div class="radio-item">
          <input type="checkbox" id="newTabsInForeground"
                 ?checked=${this.settings.new_tabs_in_foreground == 1}
                 @change=${this.onNewTabsInForegroundToggle} />
          <label for="newTabsInForeground">
            When you open a link in a new tab, switch to it immediately
          </label>
        </div>
      </div>
    `
  }

  renderOnStartupSettings () {
    return html`
      <div class="section">
        <p>When Beaker starts</p>

        <div class="radio-item">
          <input type="radio" id="customStartPage1" name="custom-start-page"
                 value="blank"
                 ?checked=${this.settings.custom_start_page === 'blank'}
                 @change=${this.onCustomStartPageChange} />
          <label for="customStartPage1">
            Show a new tab
          </label>
        </div>
        <div class="radio-item">
          <input type="radio" id="customStartPage2" name="custom-start-page"
                 value="previous"
                 ?checked=${this.settings.custom_start_page === 'previous'}
                 @change=${this.onCustomStartPageChange} />
          <label for="customStartPage2">
            Show tabs from your last session
          </label>
        </div>
      </div>
    `
  }

  renderRunBackgroundSettings () {
    return html`
      <div class="section on-startup">
        <p>
          Running in the background helps keep your data online even if you're not using Beaker.
        </p>

        <div class="radio-item">
          <input type="checkbox" id="runBackground"
                 ?checked=${this.settings.run_background == 1}
                 @change=${this.onRunBackgroundToggle} />
          <label for="runBackground">
            Let Beaker run in the background
          </label>
        </div>
      </div>
    `
  }

  renderNewTabSettings () {
    return html`
      <div class="section">
        <p>When you create a new tab, show</p>

        <div>
          <input name="new-tab"
                 id="newTab"
                 type="text"
                 value=${this.settings.new_tab || 'beaker://desktop/'}
                 @input=${this.onNewTabChange}
                 style="width: 300px" />
          <button @click=${this.onClickBrowseNewTab}>Browse...</button>
          <button @click=${this.onClickDefaultNewTab}>Use Default</button>
        </div>
      </div>
    `
  }

  renderSearchSettings() {
    return html`
      <div class="section">
        <div class="search-settings-list">
          ${this.settings.search_engines.map((engine,i)=>{
            return html`
              <div class="radio-item">
                <input type="radio"
                  id="engine${i}"
                  name="search-engine"
                  value="${i}"
                  ?checked="${engine.selected}"
                  @change="${this.onSearchEngineChange}"
                >
                <label for="engine${i}">
                  ${engine.name} (${engine.url})
                  ${this.settings.search_engines.length === 1 ? '' : html`
                    <a @click="${()=>this.removeSearchEngine(i)}" data-tooltip="Remove" title="Remove Search Engine">
                      <span class="fas fa-fw fa-times"></span>
                    </a>
                  `}
                </label>
              </div>`
            })
          }
        </div>
        <form @submit=${this.onAddSearchEngine}>
          <input type="text" placeholder="Name" id="custom-engine-name" required>
          <input type="url" placeholder="URL" id="custom-engine-url" required>
          <button type="submit">Add</button>
        </form>
      </div>
    `
  }

  renderDefaultZoomSettings () {
    const opt = (v, label) => html`
      <option value=${v} ?selected=${v === this.settings.default_zoom}>${label}</option>
    `;
    return html`
      <div class="section">
        <p>Pages should use the following "zoom" setting by default:</p>

        <div>
          <select @change=${this.onChangeDefaultZoom}>
            ${opt(-3, '25%')}
            ${opt(-2.5, '33%')}
            ${opt(-2, '50%')}
            ${opt(-1.5, '67%')}
            ${opt(-1, '75%')}
            ${opt(-0.5, '90%')}
            ${opt(0, '100%')}
            ${opt(0.5, '110%')}
            ${opt(1, '125%')}
            ${opt(1.5, '150%')}
            ${opt(2, '175%')}
            ${opt(2.5, '200%')}
            ${opt(3, '250%')}
            ${opt(3.5, '300%')}
            ${opt(4, '400%')}
            ${opt(4.5, '500%')}
          </select>
        </div>
      </div>
    `
  }

  renderProtocolSettings () {
    const toggleRegistered = (protocol) => {
      // update and optimistically render
      this.defaultProtocolSettings[protocol] = !this.defaultProtocolSettings[protocol];

      if (this.defaultProtocolSettings[protocol]) {
        beaker.browser.setAsDefaultProtocolClient(protocol);
      } else {
        beaker.browser.removeAsDefaultProtocolClient(protocol);
      }
      create('Setting updated');
      this.requestUpdate();
    };

    return html`
      <div class="section">
        <p>Set Beaker as the default browser for:</p>

        ${Object.keys(this.defaultProtocolSettings).map(proto => html`
          <div class="radio-item">
            <input id="proto-${proto}" ?checked=${this.defaultProtocolSettings[proto]} type="checkbox" @change=${() => toggleRegistered(proto)} />
            <label for="proto-${proto}">
              <span class="text">
                ${proto}://
              </span>
            </label>
          </div>
        `)}
      </div>`
  }

  renderThemeSettings () {
    return html`
      <div class="section">
        <p>Browser theme:</p>

        <div class="radio-item">
          <input type="radio" id="browserTheme1" name="browser-theme"
                 value="system"
                 ?checked=${this.settings.browser_theme === 'system'}
                 @change=${this.onBrowserThemeChange} />
          <label for="browserTheme1">
            Default (use system value)
          </label>
        </div>
        <div class="radio-item">
          <input type="radio" id="browserTheme2" name="browser-theme"
                 value="light"
                 ?checked=${this.settings.browser_theme === 'light'}
                 @change=${this.onBrowserThemeChange} />
          <label for="browserTheme2">
            Light mode
          </label>
        </div>
        <div class="radio-item">
          <input type="radio" id="browserTheme3" name="browser-theme"
                 value="dark"
                 ?checked=${this.settings.browser_theme === 'dark'}
                 @change=${this.onBrowserThemeChange} />
          <label for="browserTheme3">
            Dark mode
          </label>
        </div>
      </div>
    `
  }

  renderAnalyticsSettings () {
    const toggle = () => {
      // update and optimistically render
      this.settings.analytics_enabled = (this.settings.analytics_enabled == 1) ? 0 : 1;
      beaker.browser.setSetting('analytics_enabled', this.settings.analytics_enabled);
      this.requestUpdate();
      create('Setting updated');
    };

    return html`
      <div class="section analytics">
        <div class="radio-item">
          <input id="enable-analytics" ?checked=${this.settings.analytics_enabled == 1} type="checkbox" @change=${toggle} />
          <label for="enable-analytics">
            <span>
              Enable analytics
            </span>
          </label>
        </div>

        <div class="message">
          <p>Help us know how we${"'"}re doing! Enabling analytics will send us the following information once a week:</p>

          <ul>
            <li>An anonymous ID</li>
            <li>Your Beaker version, e.g. ${this.browserInfo.version}</li>
            <li>Your operating system, e.g. Windows 10</li>
          </ul>
        </div>
      </div>`
  }

  // events
  // =

  onUpdaterStateChanged (e) {
    console.debug('onUpdaterStateChanged', e);
    if (!this.browserInfo) { return }
    this.browserInfo.updater.state = e.state;
    this.browserInfo.updater.error = false;
    this.requestUpdate();
  }

  async onUpdaterError (err) {
    console.debug('onUpdaterError', err);
    if (!this.browserInfo) { return }
    this.browserInfo = await beaker.browser.getInfo();
    this.requestUpdate();
  }

  onClickCheckUpdates () {
    // trigger check
    beaker.browser.checkForUpdates();
  }

  onClickCheckPrereleases (e) {
    e.preventDefault();
    beaker.browser.checkForUpdates({prerelease: true});
  }

  onClickRestart () {
    beaker.browser.restartBrowser();
  }

  onToggleAutoUpdate () {
    this.settings.auto_update_enabled = this.isAutoUpdateEnabled ? 0 : 1;
    this.requestUpdate();
    beaker.browser.setSetting('auto_update_enabled', this.settings.auto_update_enabled);
    create('Setting updated');
  }

  onCustomStartPageChange (e) {
    this.settings.custom_start_page = e.target.value;
    beaker.browser.setSetting('custom_start_page', this.settings.custom_start_page);
    create('Setting updated');
  }

  onBrowserThemeChange (e) {
    this.settings.browser_theme = e.target.value;
    beaker.browser.setSetting('browser_theme', this.settings.browser_theme);
    create('Setting updated');
  }

  onNewTabsInForegroundToggle (e) {
    this.settings.new_tabs_in_foreground = this.settings.new_tabs_in_foreground == 1 ? 0 : 1;
    beaker.browser.setSetting('new_tabs_in_foreground', this.settings.new_tabs_in_foreground);
    create('Setting updated');
  }

  onRunBackgroundToggle (e) {
    this.settings.run_background = this.settings.run_background == 1 ? 0 : 1;
    beaker.browser.setSetting('run_background', this.settings.run_background);
    create('Setting updated');
  }

  onNewTabChange (e) {
    this.settings.new_tab = e.target.value;
    beaker.browser.setSetting('new_tab', this.settings.new_tab);
    create('Setting updated');
  }

  async onClickBrowseNewTab (e) {
    var sel = await beaker.shell.selectFileDialog({
      allowMultiple: false
    });
    if (sel) {
      this.settings.new_tab = sel[0].url;
      beaker.browser.setSetting('new_tab', this.settings.new_tab);
      create('Setting updated');
      this.requestUpdate();
    }
  }

  onClickDefaultNewTab (e) {
    this.settings.new_tab = 'beaker://desktop/';
    beaker.browser.setSetting('new_tab', this.settings.new_tab);
    create('Setting updated');
    this.requestUpdate();
  }

  onSearchEngineChange (e) {
    const index = e.target.value;
    for (let se of this.settings.search_engines) {
      delete se.selected;
    }
    this.settings.search_engines[index].selected = true;
    beaker.browser.setSetting('search_engines', this.settings.search_engines);
    create('Setting updated');
    this.requestUpdate();
  }

  removeSearchEngine (i) {
    // decrement selected search engine so it points to the same one if the removed index is less than current one
    let wasSelected = this.settings.search_engines[i].selected;
    this.settings.search_engines.splice(i, 1);
    if (wasSelected) {
      this.settings.search_engines[0].selected = true;
    }
    beaker.browser.setSetting('search_engines', this.settings.search_engines);
    this.requestUpdate();
  }

  onAddSearchEngine (e) {
    e.preventDefault();
    const name = this.shadowRoot.getElementById('custom-engine-name');
    const url  = this.shadowRoot.getElementById('custom-engine-url');
    this.settings.search_engines.push({name: name.value, url: url.value});
    beaker.browser.setSetting('search_engines', this.settings.search_engines);
    name.value ="";
    url.value="";
    this.requestUpdate();
  }

  onChangeDefaultZoom (e) {
    this.settings.default_zoom = +(e.currentTarget.value);
    beaker.browser.setSetting('default_zoom', this.settings.default_zoom);
    create('Setting updated');
  }

  async onClickRestartDaemon (e) {
    let el = e.currentTarget;
    el.innerHTML = '<span class="spinner"></span>';
    await beaker.browser.reconnectHyperdriveDaemon();
    this.browserInfo = await beaker.browser.getInfo();
    this.requestUpdate();
  }

  async onClickAddSiteToBeakerNetwork (e) {
    this.listingSelfState = 'attempting';
    this.requestUpdate();

    await beaker.browser.addProfileToBeakerNetwork();
    this.isProfileListedInBeakerNetwork = true;
    this.listingSelfState = 'done';
    this.requestUpdate();
  }
}
customElements.define('general-settings-view', GeneralSettingsView);

const cssStr$d = css`
${cssStr$2}
${cssStr$6}
${cssStr$9}

:host {
  display: block;
  max-width: 600px;
}

a {
  color: var(--blue);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.section {
  margin-bottom: 30px;
}

.form-group {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 10px 12px;
  margin-bottom: 16px;
}

.form-group .section {
  margin-bottom: 0;
  padding: 0 10px 4px;
}

.form-group .section:not(:last-child) {
  margin-bottom: 0;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.form-group .section > :first-child {
  margin-top: 16px;
}

.form-group h2 {
  margin: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}


input[type="text"], input[type="url"] {
  height: 24px;
  padding: 0 7px;
  border-radius: 4px;
  color: rgba(51, 51, 51, 0.95);
  border: 1px solid #d9d9d9;
  box-shadow: inset 0 1px 2px #0001;
}

textarea {
  padding: 7px;
  border-radius: 4px;
  color: rgba(51, 51, 51, 0.95);
  border: 1px solid #d9d9d9;
  box-shadow: inset 0 1px 2px #0001;
}

input[type="text"]:focus,
input[type="url"]:focus,
textarea:focus {
  outline: 0;
  border: 1px solid rgba(41, 95, 203, 0.8);
  box-shadow: 0 0 0 2px rgba(41, 95, 203, 0.2);
}

input[type="checkbox"] {
  margin: 0px 7px 0px 2px;
}

.site-block-list .unblock-btn {
  color: var(--text-color--very-light);
  cursor: pointer;
  font-size: 12px;
  margin-right: 3px;
}

.adblock-settings-list {
}

.adblock-settings-list a {
  color: var(--text-color--very-light);
  cursor: pointer;
  font-size: 12px;
  margin-right: 3px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.checkbox-item:last-child {
  margin-bottom: 0;
}

.checkbox-item small {
  color: var(--text-color--light);
}

form {
  padding: 8px;
  background: var(--bg-color--light);
}

`;

const DRIVE_KEY_REGEX = /[0-9a-f]{64}/i;

function pluralize (num, base, suffix = 's') {
  if (num === 1) { return base }
  return base + suffix
}

function toDomain (str) {
  if (!str) return ''
  try {
    var urlParsed = new URL(str);
    return urlParsed.hostname
  } catch (e) {
    // ignore, not a url
  }
  return str
}

function toNiceDomain (str, len=4) {
  var domain = str.includes('://') ? toDomain(str) : str;
  if (DRIVE_KEY_REGEX.test(domain)) {
    domain = `${domain.slice(0, len)}..${domain.slice(-2)}`;
  }
  return domain
}

class BlockingSettingsView extends LitElement {
  static get properties () {
    return {
    }
  }

  static get styles () {
    return cssStr$d
  }

  constructor () {
    super();
    this.settings = undefined;
    this.browserInfo = undefined;
  }

  async load () {
    // fetch data
    this.browserInfo = await beaker.browser.getInfo();
    this.settings = await beaker.browser.getSettings();
    console.log('loaded', {
      browserInfo: this.browserInfo,
      settings: this.settings
    });
    this.requestUpdate();
  }

  // rendering
  // =

  render () {
    if (!this.browserInfo) return html``
    return html`
      <link rel="stylesheet" href="beaker://assets/font-awesome.css">
      <div class="form-group">
        <h2>Adblock Filter Lists</h2>
        ${this.renderAdblockFilterLists()}
      </div>
    `
  }

  renderAdblockFilterLists() {
    return html`
      <div class="section">
        <div class="adblock-settings-list">
          ${this.settings.adblock_lists.map((adblockList,i)=>{
            return html`
              <div class="checkbox-item">
                ${this.settings.adblock_lists.length === 1 ? '' : html`
                  <a @click="${()=>this.removeAdblockList(i)}" data-tooltip="Remove" title="Remove Adblock List">
                    <span class="fas fa-fw fa-times"></span>
                  </a>
                `}
                <input type="checkbox"
                  id="adblockList${i}"
                  name="adblock-lists"
                  value="${i}"
                  ?checked="${adblockList.selected}"
                  @change="${this.onAdblockListChange}"
                >
                <label for="adblockList${i}">
                  ${adblockList.name} <small>${adblockList.url}</small>
                </label>
              </div>`
            })
          }
        </div>
      </div>
      <form @submit=${this.onAddAdblockList}>
        <input type="text" placeholder="Name" id="custom-adblock-list-name" required>
        <input type="url" placeholder="URL" id="custom-adblock-list-url" required>
        <button type="submit">Add</button>
      </form>
    `
  }

  // events
  // =

  onAdblockListChange (e) {
    const index = e.target.value;
    if (e.target.checked) {
      this.settings.adblock_lists[index].selected = true;
    } else {
      delete this.settings.adblock_lists[index].selected;
    }
    beaker.browser.setSetting('adblock_lists', this.settings.adblock_lists);
    beaker.browser.updateAdblocker();
    create('Setting updated');
    this.requestUpdate();
  }

  removeAdblockList (i) {
    // decrement selected search engine so it points to the same one if the removed index is less than current one
    this.settings.adblock_lists.splice(i, 1);
    beaker.browser.setSetting('adblock_lists', this.settings.adblock_lists);
    beaker.browser.updateAdblocker();
    this.requestUpdate();
  }

  onAddAdblockList (e) {
    e.preventDefault();
    const name = this.shadowRoot.getElementById('custom-adblock-list-name');
    const url  = this.shadowRoot.getElementById('custom-adblock-list-url');
    this.settings.adblock_lists.push({name: name.value, url: url.value, selected: true});
    beaker.browser.setSetting('adblock_lists', this.settings.adblock_lists);
    beaker.browser.updateAdblocker();
    name.value ="";
    url.value="";
    this.requestUpdate();
  }
}
customElements.define('blocking-settings-view', BlockingSettingsView);

class InfoSettingsView extends LitElement {
  static get properties () {
    return {
      isVersionsExpanded: {type: Boolean}
    }
  }

  static get styles () {
    return cssStr$b
  }

  constructor () {
    super();
    this.browserInfo = undefined;
    this.daemonStatus = undefined;
    this.isVersionsExpanded = false;
  }

  async load () {
    this.browserInfo = await beaker.browser.getInfo();
    this.daemonStatus = await beaker.browser.getDaemonStatus();
    console.log('loaded', {
      browserInfo: this.browserInfo,
      daemonStatus: this.daemonStatus
    });
    this.requestUpdate();
  }

  // rendering
  // =

  render () {
    if (!this.browserInfo) return html``
    return html`
      <link rel="stylesheet" href="beaker://assets/font-awesome.css">
      <div class="section">
        <h2 id="information" class="subtitle-heading">About Beaker</h2>
        <p>
          <strong>Version</strong>:
          ${this.browserInfo.version}
          <button class="transparent" @click=${e => {this.isVersionsExpanded = !this.isVersionsExpanded;}} style="padding: 4px 4px 3px">
            <span class="far fa-${this.isVersionsExpanded ? 'minus' : 'plus'}-square"></span>
          </button>
        </p>
        ${this.isVersionsExpanded ? html`
          <ul class="versions">
            <li><strong>Electron:</strong> ${this.browserInfo.electronVersion}</li>
            <li><strong>Chromium:</strong> ${this.browserInfo.chromiumVersion}</li>
            <li><strong>Node:</strong> ${this.browserInfo.nodeVersion}</li>
            <li><strong>Hyperspace API:</strong> ${this.daemonStatus.apiVersion}</li>
          </ul>
        ` : ''}
        <p><strong>User data</strong>: ${this.browserInfo.paths.userData}</p>
      </div>
    `
  }
}
customElements.define('info-settings-view', InfoSettingsView);

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

class NetworkView extends LitElement {
  static get properties () {
    return {
      networkStatus: {type: Array}
    }
  }

  static get styles () {
    return [cssStr$b, css`
    :host {
      max-width: none;
    }

    table {
      width: 100%;
    }

    td {
      border-top: 1px solid #dde;
      padding: 12px 16px;
      font-family: monospace;
      white-space: nowrap;
    }

    td:last-child {
      width: 100%;
    }

    progress {
      width: 40px;
    }
    `]
  }

  constructor () {
    super();
    this.networkStatus = undefined;
    this.error = undefined;
  }

  async load () {
    this.error = undefined;
    try {
      var networkStatus = await beaker.browser.getDaemonNetworkStatus();
      for (let item of networkStatus) {
        item.drive = await beaker.drives.get(item.key);
        item.peers.sort((a, b) => a.remoteAddress.localeCompare(b.remoteAddress)); // helps spot dupes
      }
      networkStatus.sort((a, b) => b.peers.length - a.peers.length);
      this.networkStatus = networkStatus;
      console.log(this.networkStatus);
    } catch (e) {
      console.error(e);
      this.error = e;
    }
  }

  unload () {
  }

  // rendering
  // =

  render () {
    return html`
      <link rel="stylesheet" href="beaker://assets/font-awesome.css">
      <h3>Active Drives</h3>
      ${this.error ? html`
        <pre>${this.error.toString()}</pre>
      ` : this.networkStatus ? html `
        ${this.networkStatus.length === 0 ? html`
          <p><em>No active drives</em></p>
        ` : ''}
        <table>
          ${repeat(this.networkStatus, (v, i) => i, item => this.renderDriveStatus(item))}
        </table>
      ` : html`<p><span class="spinner"></span></p>`}
    `
  }

  renderDriveStatus (item) {
    var {key, peers, drive} = item;
    var domain = drive && drive.ident.system ? 'private' : `${key.slice(0, 6)}..${key.slice(-2)}`;
    var title = drive && drive.info && drive.info.title ? `${drive.info.title} (${domain})` : domain;
    var forkOf = drive.forkOf ? ` ["${drive.forkOf.label}" fork of ${toNiceDomain(drive.forkOf.key)}]` : '';
    return html`
      <tr>
        <td>
          <a href="hyper://${drive && drive.ident.system ? 'private' : key}/" target="_blank">
            ${title}
            ${forkOf}
          </a>
        </td>
        <td>
          <details>
            <summary>${peers.length} ${pluralize(peers.length, 'peer')}</summary>
            ${peers.map(p => html`<div>${p.remoteAddress} (${p.type})</div>`)}
          </details>
        </td>
      </tr>
    `
  }

  // events
  // =

}
customElements.define('network-view', NetworkView);

const cssStr$e = css`
${cssStr$2}
${cssStr$6}

:host {
  display: block;
  width: calc(100vw - 250px);
}

a {
  color: var(--blue);
}

.stats {
  margin-bottom: 10px;
}

.stats table {
  width: 100%;
}

.stats th {
  width: 100px;
  min-width: 100px; /* stop table layout from compressing */
  vertical-align: top;
  text-align: left;
}

.logger thead th {
  position: sticky;
  top: 0;
  text-align: left;
  background: var(--bg-color--light);
}

.logger .gap-row td {
  height: 8px;
  background: var(--bg-color--light);
}

.logger .logger-row > * {
  border: 1px solid var(--border-color--light);
}

.logger .logger-row > *:not(.args) {
  white-space: nowrap;
}

.logger .logger-row > .args {
  word-break: break-word;
}

.logger .logger-row.badish {
  background: #fc03;
}

.logger .logger-row.bad {
  background: #f003;
}

.logger .logger-row td {
  padding: 4px;
}

.logger .logger-row:hover {
  background: var(--bg-color--light);
}

.logger .logger-row small {
  color: rgba(0, 0, 0, 0.5);
}
`;

const yearFormatter = new Intl.DateTimeFormat('en-US', {year: 'numeric'});
const CURRENT_YEAR = yearFormatter.format(new Date());

// simple timediff fn
// replace this with Intl.RelativeTimeFormat when it lands in Beaker
// https://stackoverflow.com/questions/6108819/javascript-timestamp-to-relative-time-eg-2-seconds-ago-one-week-ago-etc-best
const msPerMinute = 60 * 1000;
const msPerHour = msPerMinute * 60;
const msPerDay = msPerHour * 24;
const msPerMonth = msPerDay * 30;
const msPerYear = msPerDay * 365;
const now = Date.now();
function timeDifference (ts, short = false, postfix = 'ago') {
  ts = Number(new Date(ts));
  var elapsed = now - ts;
  if (elapsed < 1) elapsed = 1; // let's avoid 0 and negative values
  if (elapsed < msPerMinute) {
    let n = Math.round(elapsed/1000);
    return `${n}${short ? 's' : pluralize(n, ' second')} ${postfix}`
  } else if (elapsed < msPerHour) {
    let n = Math.round(elapsed/msPerMinute);
    return `${n}${short ? 'm' : pluralize(n, ' minute')} ${postfix}`
  } else if (elapsed < msPerDay) {
    let n = Math.round(elapsed/msPerHour);
    return `${n}${short ? 'h' : pluralize(n, ' hour')} ${postfix}`
  } else if (elapsed < msPerMonth) {
    let n = Math.round(elapsed/msPerDay);
    return `${n}${short ? 'd' : pluralize(n, ' day')} ${postfix}`
  } else if (elapsed < msPerYear) {
    let n = Math.round(elapsed/msPerMonth);
    return `${n}${short ? 'mo' : pluralize(n, ' month')} ${postfix}`
  } else {
    let n = Math.round(elapsed/msPerYear);
    return `${n}${short ? 'yr' : pluralize(n, ' year')} ${postfix}`
  }
}

class FsAuditLogView extends LitElement {
  static get properties () {
    return {
    }
  }

  static get styles () {
    return cssStr$e
  }

  constructor () {
    super();

    this.isLoading = false;
    this.stats = undefined;
    this.rows = undefined;
  }

  async load () {
    this.isLoading = true;
    this.requestUpdate();

    this.rows = await beaker.logger.listAuditLog({keys: [], limit: 5e3});

    this.isLoading = false;
    this.requestUpdate();

    this.stats = await beaker.logger.getAuditLogStats();
    this.requestUpdate();
  }

  unload () {
  }

  // rendering
  // =

  render () {
    if (!this.rows) {
      return html`
        <link rel="stylesheet" href="beaker://assets/font-awesome.css">
        <div class="logger loading">Loading...</div>
      `
    }

    var lastRow;
    return html`
      <link rel="stylesheet" href="beaker://assets/font-awesome.css">
      <div class="stats">
        ${this.stats ? html`
          <table>
            <tr><th>Average:</th><td>${this.stats.runtime.avg|0}ms</td></tr>
            <tr><th>Std Deviation:</th><td>${this.stats.runtime.stdDev|0}ms</td></tr>
            <tr>
              <th>10 longest:</th>
              <td>
                <details>
                  <summary>${this.stats.runtime.longest10.map(row => row.runtime + 'ms').join(', ')}</summary>
                  <pre>${JSON.stringify(this.stats.runtime.longest10, null, 2)}</pre>
                </details>
              </td>
            </tr>
          </table>
        ` : html`
          <span class="spinner"></span>
        `}
      </div>
      <div class="logger">
        <table class="rows">
          <thead>
            <tr class="logger-row">
              <th class="caller">caller</th>
              <th class="target">target</th>
              <th class="ts">ts</th>
              <th class="runtime">run time</th>
              <th class="method">method</th>
              <th class="args">args</th>
            </tr>
          </thead>
          <tbody>${this.rows.map((row, i) => {
            var tsDiff = lastRow ? (lastRow.ts - row.ts) : 0;
            lastRow = row;
            return html`
              ${tsDiff > 5e3 ? html`<tr class="gap-row"><td colspan="6"></td></tr>` : ''}
              <tr class="logger-row ${row.runtime > 250 ? 'badish' : ''} ${row.runtime > 1e3 ? 'bad' : ''}">
                <td class="caller">
                  ${row.caller && !row.caller.startsWith('-') ? html`
                    <a href=${row.caller} target="_blank">${toNiceDomain(row.caller || '')}</a>
                  ` : row.caller}
                </td>
                <td class="target">
                  ${row.target ? html`
                    <a href=${'hyper://' + row.target} target="_blank">${toNiceDomain(row.target)}</a>
                  ` : ''}
                </td>
                <td class="ts"><code>${timeDifference(row.ts, true)}</code></td>
                <td class="runtime"><code>${row.runtime}ms</code></td>
                <td class="method"><code>${row.method}</code></td>
                <td class="args"><code>${row.args}</code></td>
              </tr>
            `
          })}</tbody>
        </table>
      </div>
    `
  }

  // events
  // =

}
customElements.define('fs-audit-log-view', FsAuditLogView);

class DaemonLogView extends LitElement {
  static get properties () {
    return {
    }
  }

  static get styles () {
    return cssStr$e
  }

  constructor () {
    super();

    this.isLoading = false;
    this.rows = undefined;
  }

  async load () {
    this.isLoading = true;
    this.requestUpdate();

    this.rows = await beaker.logger.listDaemonLog();

    this.isLoading = false;
    this.requestUpdate();
  }

  unload () {
  }

  // rendering
  // =

  render () {
    if (!this.rows) {
      return html`
        <link rel="stylesheet" href="beaker://assets/font-awesome.css">
        <div class="logger loading">Loading...</div>
      `
    }

    return html`
      <link rel="stylesheet" href="beaker://assets/font-awesome.css">
      <div class="logger">
        <table class="rows">
          <thead>
            <tr class="logger-row">
              <th class="level">level</th>
              <th class="time">time</th>
              <th class="method">method</th>
              <th class="msg">msg</th>
            </tr>
          </thead>
          <tbody>${this.rows.map((row, i) => this.renderRow(row, i))}</tbody>
        </table>
      </div>
    `
  }

  renderRow (row, i) {
    return html`
      <tr class="logger-row">
        <td class="level"><code>${row.level}</code></td>
        <td class="time"><code>${timeDifference(row.time, true)}</code></td>
        <td class="method"><code>${row.method}</code></td>
        <td class="msg"><code>${row.stack || row.msg}</code></td>
      </tr>
    `
  }

  // events
  // =

}
customElements.define('daemon-log-view', DaemonLogView);

const cssStr$f = css`
${cssStr$2}
${cssStr$6}

:host {
  display: block;
}

.logger .controls {
  position: sticky;
  top: 0;
  background: var(--bg-color--default);
}

.logger .standard-controls {
  display: flex;
  align-items: center;
  color: var(--text-color--lightish);
  padding: 6px 0;
}

.logger .standard-controls input {
  display: none;
}

.logger .standard-controls .spacer {
  flex: 1;
}

.logger .standard-controls .divider {
  margin-left: 20px;
  margin-right: 5px;
  border-right: 1px solid var(--border-color--light);
  height: 14px;
}

.logger .standard-controls .divider.thin {
  margin-left: 5px;
}

.logger .standard-controls label {
  margin-left: 15px;
  margin-bottom: 0;
  font-weight: normal;
}

.logger .standard-controls .status {
  margin-left: 8px;
}

.logger .logger-row td {
  padding: 4px;
  border-top: 1px solid var(--bg-color--default);
}

.logger .logger-row.purple {
  /*background: #fdf3ff;*/
  color: #9C27B0;
}

.logger .logger-row.blue {
  /*background: #e6f4ff;*/
  color: #2196F3;
}

.logger .logger-row.cyan {
  /*background: #e7fcff;*/
  color: #00BCD4;
}

.logger .logger-row.green {
  /*background: #f1f9f1;*/
  color: #4CAF50;
}

.logger .logger-row.yellow {
  /*background: #fff3cc;*/
  color: #FFC107;
}

.logger .logger-row.red {
  /*background: #fddee9;*/
  color: #E91E63;
}

.logger .logger-row:hover {
  background: var(--bg-color--default);
}

.logger .logger-row .msg {
  color: var(--text-color--dark);
}

.logger .logger-row .level,
.logger .logger-row .category,
.logger .logger-row .subcategory,
.logger .logger-row .timestamp {
  white-space: nowrap;
}

.logger .logger-row .level {
  font-weight: 500;
}

.logger .logger-row small {
  color: rgba(0, 0, 0, 0.5);
}
`;

const AVAILABLE_LEVELS = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];
const AVAILABLE_CATEGORIES = ['all', 'hyper'];

class LogSettingsView extends LitElement {
  static get properties () {
    return {
    }
  }

  static get styles () {
    return cssStr$f
  }

  constructor () {
    super();

    this.isLoading = false;
    this.isControlsExpanded = false;
    this.rows = undefined;
    this.readStream = undefined;
    this.isPaused = false;
    this.pauseTime = undefined;

    try {
      this.settings = JSON.parse(localStorage.logViewerSettings);
    } catch (e) {
      this.settings = {
        level: AVAILABLE_LEVELS.slice(0, -1),
        category: 'all',
        customRules: []
      };
    }
  }

  async load () {
    this.isLoading = true;
    this.requestUpdate();
    var filter = {level: this.settings.level};
    if (this.settings.category !== 'all') filter.category = this.settings.category;
    this.rows = await beaker.logger.query({limit: 5e2, filter, until: this.pauseTime, sort: 'desc'});
    this.rows = this.rows.filter(row => this.applyCustomRules(row));

    if (this.readStream) this.readStream.close();
    if (!this.isPaused) {
      this.readStream = beaker.logger.stream({since: Date.now(), filter});
      this.readStream.addEventListener('data', row => {
        if (!this.applyCustomRules(row)) return
        this.rows.unshift(row);
        // this.prependRowEl(this.renderRow(row, this.rows.length))
        this.requestUpdate();
      });
    }

    this.isLoading = false;
    this.requestUpdate();
  }

  unload () {
    if (this.readStream) this.readStream.close();
  }

  applyCustomRules (row) {
    if (this.settings.customRules.length === 0) {
      return true
    }

    var ret = true;
    var rowJson = renderObject(row).toLowerCase();
    for (let filter of this.settings.customRules) {
      let isMatch = rowJson.indexOf(filter.query.toLowerCase()) !== -1;
      if (isMatch) {
        if (filter.effect === 'exclude-matches') {
          ret = false;
        } else if (filter.effect.startsWith('highlight-')) {
          row.highlight = filter.effect.slice('highlight-'.length);
        }
      } else {
        if (filter.effect === 'exclude-nonmatches') {
          ret = false;
        }
      }
    }
    return ret
  }

  saveSettings () {
    localStorage.logViewerSettings = JSON.stringify(this.settings);
  }

  // rendering
  // =

  render () {
    if (!this.rows) {
      return html`
        <link rel="stylesheet" href="beaker://assets/font-awesome.css">
        <div class="logger loading">Loading...</div>
      `
    }

    return html`
      <link rel="stylesheet" href="beaker://assets/font-awesome.css">
      <div class="logger">
        ${this.renderControls()}
        <table class="rows">
          <tbody>${this.rows.map((row, i) => this.renderRow(row, i))}</tbody>
        </table>
      </div>
    `
  }

  renderControls () {
    const option = (curr, v, label) => {
      return html`<option value="${v}" ?selected=${curr === v}>${label}</option>`
    };
    return html`
      <div class="controls">
        <div class="standard-controls">
          <button class="btn transparent" @click=${this.onToggleControlsExpanded}>
            <i class="fas fa-${this.isControlsExpanded ? 'angle-down' : 'angle-up'}"></i>
          </button>
          <span class="divider thin"></span>
          ${AVAILABLE_LEVELS.map(level => this.renderLevelFilter(level))}
          <span class="divider"></span>
          ${AVAILABLE_CATEGORIES.map(category => this.renderCategoryFilter(category))}
          <span class="divider"></span>
          <span class="status">
            <button class="btn transparent" @click=${this.onTogglePaused}>
              <i class="fa fa-${this.isPaused ? 'play' : 'pause'}"></i>
              ${this.isPaused ? 'Resume' : 'Pause'}
            </button>
            ${this.isLoading
              ? '[ Loading... ]'
              : this.isPaused
                ? ''
                : '[ Streaming ]'}
          </span>
        </div>
        ${this.isControlsExpanded ? this.settings.customRules.map(rule => html`
          <div class="custom-filter-controls">
            <input type="text" value=${rule.query} @change=${e => this.onChangeCustomRuleQuery(e, rule)}>
            <select @change=${e => this.onChangeCustomRuleEffect(e, rule)}>
              ${option(rule.effect, 'exclude-nonmatches', 'Exclude non-matches')}
              ${option(rule.effect, 'exclude-matches', 'Exclude matches')}
              ${option(rule.effect, 'highlight-green', 'Highlight Green')}
              ${option(rule.effect, 'highlight-blue', 'Highlight Blue')}
              ${option(rule.effect, 'highlight-cyan', 'Highlight Cyan')}
              ${option(rule.effect, 'highlight-purple', 'Highlight Purple')}
              ${option(rule.effect, 'highlight-yellow', 'Highlight Yellow')}
              ${option(rule.effect, 'highlight-red', 'Highlight Red')}
            </select>
            <button class="btn transparent" @click=${() => this.onRemoveCustomRule(rule)}>
              <i class="fa fa-times"></i>
            </button>
          </div>
        `) : ''}
        ${this.isControlsExpanded
          ? html`
            <div>
              <button class="btn transparent" @click=${this.onAddCustomRule}>
                <i class="fas fa-plus"></i> Add rule
              </button>
            </div>`
          : ''}
      </div>`
  }

  renderLevelFilter (level) {
    var isChecked = this.settings.level.includes(level);
    return html`
      <label>
        <input type="checkbox" ?checked=${isChecked} @change=${() => this.onToggleLevelFilter(level)}>
        <i class="far ${isChecked ? 'fa-check-square' : 'fa-square'}"></i> ${level}
      </label>
    `
  }

  renderCategoryFilter (category) {
    var isChecked = this.settings.category === category;
    return html`
      <label>
        <input type="checkbox" ?checked=${isChecked} @change=${() => this.onSelectCategory(category)}>
        <i class="far ${isChecked ? 'fa-check-circle' : 'fa-circle'}"></i> ${category}
      </label>
    `
  }

  renderRow (row, i) {
    return html`
      <tr class="logger-row ${row.highlight || ''}">
        <td class="level ${row.level}">${row.level}</td>
        <td class="category">${row.category}</td>
        <td class="subcategory">${row.subcategory || row.dataset}</td>
        <td class="msg">${row.message} ${row.details ? renderDetails(row.details) : ''}</td>
        <td class="timestamp">${row.timestamp}</td>
      </tr>
    `
  }

  // events
  // =

  onToggleLevelFilter (level) {
    // toggle the filter
    if (this.settings.level.includes(level)) {
      this.settings.level = this.settings.level.filter(l => l !== level);
    } else {
      this.settings.level.push(level);
    }
    this.saveSettings();

    // reload
    this.requestUpdate();
    this.load();
  }

  onSelectCategory (category) {
    this.settings.category = category;
    this.saveSettings();

    // reload
    this.requestUpdate();
    this.load();
  }

  onToggleControlsExpanded () {
    this.isControlsExpanded = !this.isControlsExpanded;
    this.requestUpdate();
  }

  onAddCustomRule () {
    this.settings.customRules.push(new CustomRule());
    this.saveSettings();
    this.requestUpdate();
  }

  onRemoveCustomRule (rule) {
    this.settings.customRules = this.settings.customRules.filter(f => f !== rule);
    this.saveSettings();
    this.requestUpdate();
    this.load();
  }

  onChangeCustomRuleQuery (e, rule) {
    rule.query = e.currentTarget.value;
    this.saveSettings();
    this.load();
  }

  onChangeCustomRuleEffect (e, rule) {
    rule.effect = e.currentTarget.value;
    this.saveSettings();
    this.load();
  }

  onTogglePaused () {
    this.isPaused = !this.isPaused;
    this.pauseTime = (this.isPaused) ? Date.now() : undefined;
    this.requestUpdate();
    if (this.isPaused) {
      this.readStream.close();
      this.readStream = null;
    } else {
      this.load();
    }
  }
}
customElements.define('log-settings-view', LogSettingsView);

// internal
// =

class CustomRule {
  constructor () {
    this.query = '';
    this.effect = 'exclude-nonmatches';
  }
}

function renderObject (obj) {
  var items = [];
  for (let k in obj) {
    var v = obj[k];
    if (Array.isArray(v)) v = `[${v.join(', ')}]`;
    if (typeof v === 'object') v = `{${renderObject(v)}}`;
    items.push(`${k}=${v}`);
  }
  return items.join(' ')
}

function renderDetails (obj) {
  return html`<small>${renderObject(obj)}</small>`
}

class SettingsApp extends LitElement {
  static get properties () {
    return {
      currentSubview: {type: String}
    }
  }

  static get styles () {
    return cssStr$8
  }

  constructor () {
    super();
    this.currentSubview = getParam('view') || 'general';
    this.load();
  }

  async load () {
    try {
      await Promise.all(Array.from(this.shadowRoot.querySelectorAll('[loadable]'), el => el.unload()));
    } catch (e) {
      console.debug(e);
    }
    await this.requestUpdate();
    try {
      await Promise.all(Array.from(this.shadowRoot.querySelectorAll('[loadable]'), el => el.load()));
    } catch (e) {
      console.debug(e);
    }
  }

  // rendering
  // =

  render () {
    document.title = 'Settings';
    return html`
      <link rel="stylesheet" href="beaker://assets/font-awesome.css">
      <div class="subnav">${this.renderSubnav()}</div>
      <div class="subview">${this.renderSubview()}</div>
    `
  }

  renderSubnav () {
    const item = (id, icon, label) => {
      const cls = classMap({item: true, current: id === this.currentSubview});
      return html`
        <div class=${cls} @click=${e => this.onClickSubview(e, id)}><span class="fa-fw ${icon}"></span> ${label}</div>
      `
    };
    return html`
      ${item('general', 'fas fa-cog', 'General')}
      ${item('blocking', 'fas fa-ban', 'Content Blocking')}
      <hr>
      ${item('general-logs', 'fas fa-clipboard-list', 'General Logs')}
      ${item('network', 'fas fa-share-alt', 'Network Stats')}
      ${item('fs-audit-log', 'fas fa-clipboard-check', 'Filesystem Audit Log')}
      ${''/*DISABLEDitem('daemon-log', 'fas fa-clipboard-list', 'Daemon Log')*/}
      ${item('info', 'fas fa-info-circle', 'Information')}
      <hr>
    `
  }

  renderSubview () {
    switch (this.currentSubview) {
      case 'general':
        return html`<general-settings-view loadable></general-settings-view>`
      case 'blocking':
        return html`<blocking-settings-view loadable></blocking-settings-view>`
      case 'info':
        return html`<info-settings-view loadable></info-settings-view>`
      case 'network':
        return html`<network-view loadable></network-view>`
      case 'general-logs':
        return html`<log-settings-view loadable></log-settings-view>`
      case 'fs-audit-log':
        return html`<fs-audit-log-view loadable></fs-audit-log-view>`
      case 'daemon-log':
          return html`<daemon-log-view loadable></daemon-log-view>`
      default:
        return html`<div class="empty"><div><span class="fas fa-toolbox"></span></div>Under Construction</div>`
    }
  }

  // events
  // =

  onClickSubview (e, id) {
    this.currentSubview = id;
    setParams({view: id});
    this.load();
  }
}

customElements.define('settings-app', SettingsApp);

},{"lodash.debounce":2}],2:[function(require,module,exports){
(function (global){(function (){
/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max,
    nativeMin = Math.min;

/**
 * Gets the timestamp of the number of milliseconds that have elapsed since
 * the Unix epoch (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Date
 * @returns {number} Returns the timestamp.
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => Logs the number of milliseconds it took for the deferred invocation.
 */
var now = function() {
  return root.Date.now();
};

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed `func` invocations and a `flush` method to immediately invoke them.
 * Provide `options` to indicate whether `func` should be invoked on the
 * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
 * with the last arguments provided to the debounced function. Subsequent
 * calls to the debounced function return the result of the last `func`
 * invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', debounced);
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel);
 */
function debounce(func, wait, options) {
  var lastArgs,
      lastThis,
      maxWait,
      result,
      timerId,
      lastCallTime,
      lastInvokeTime = 0,
      leading = false,
      maxing = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = toNumber(wait) || 0;
  if (isObject(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    var args = lastArgs,
        thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait);
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime,
        result = wait - timeSinceLastCall;

    return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
  }

  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
  }

  function timerExpired() {
    var time = now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(now());
  }

  function debounced() {
    var time = now(),
        isInvoking = shouldInvoke(time);

    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

module.exports = debounce;

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
