/** @type {HTMLBodyElement} */
const pageRoot = document.body;

/** 
 * Append child to an element
 * @param {HTMLElement} el Element to add 
 */
HTMLElement.prototype.add = function(el)
{
    this.appendChild(el);
}

/** 
 * Add class to element
 * @param {string[]} classes Classes to add
 */
HTMLElement.prototype.addClasses = function(classes)
{
    for(var id of classes)
    {
        this.classList.add(id)
    }
}

/** 
 * Remove class to element
 * @param {string[]} classes Classes to remove
 */
HTMLElement.prototype.delClasses = function(classes)
{
    for(var id of classes)
    {
        this.classList.remove(id)
    }
}

/** 
 * Add a line break
 */
HTMLElement.prototype.br = function()
{
    this.appendChild(el.make("br"));
}

/** 
 * Install a strict number limit to an input
 */
HTMLInputElement.prototype.put_strict_number_limit = function()
{
    this.addEventListener("change", (evt) => 
    {
        evt.target.value = Math.max(Math.min(evt.target.value, evt.target.max), evt.target.min);
    });
}

/** 
 * Format a string, in this format: 
 * ```js
 * ("Day {day} / {month} Months passed").format({day : 1, month: 8})
 * ```
 */
String.prototype.format = function(kvpair)
{
    var retval = this;
    for(var k in kvpair)
    {
        var val = kvpair[k];
        retval = retval.replaceAll(`{${k}}`, val);
    }
    return retval;
}

/**
 * UI element manipulation library
 */
const el = (() => {

    /**
     * @param {string} elType Element Type
     * @param {string} id Element ID
     * @return {HTMLElement} New HTML Element */
    function new_elem(elType, id = undefined)
    {
        var el = document.createElement(elType);
        if(id != undefined)
        {
            el.setAttribute("id", id);
        }
        return el;
    }

    function new_h(index, id, text)
    {
        var el = new_elem("h"+index, id);
        el.innerHTML = text;
        return el;
    }

    function new_span(id, text)
    {
        var el = new_elem("span", id);
        el.innerHTML = text;
        return el;
    }

    function new_div(id)
    {
        return new_elem("div", id);
    }


    function new_input(id, type, configure = (el) => {})
    {
        var input = new_elem("input", id);
        input.setAttribute("type", type);
        configure(input);
        return input;
    }

    function new_image(url, id)
    {
        var img = new_elem("img", id);
        img.src = url;
        return img;
    }

    function new_input_row(label, input)
    {
        var row = new_elem("tr");

        var c1 = new_elem("td");
        var c2 = new_elem("td");

        c1.addClasses(["kvp_row_key"]);
        c2.addClasses(["kvp_row_value"]);

        row.add(c1);
        row.add(c2);
        
        c1.add(label);
        c2.add(input);

        return row;
    }

    function new_button(id, text, onclick)
    {
        var btn = new_elem("button", id)
        btn.innerText = text;
        btn.addEventListener("click", onclick);
        return btn;
    }

    var rv = {
        make: new_elem,
        header : new_h,
        span : new_span,
        div : new_div,
        btn : new_button,
        input : new_input,
        image : new_image,
        input_row: new_input_row
    }

    Object.seal(rv);

    return rv;
})();
