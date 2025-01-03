var tl = (() => { 
    const _tl_names = {
        "en": "./lang/en.json",
        "jp": "./lang/jp.json",
        "id": "./lang/id.json",
        "zh-Hans": "./lang/zh-Hans.json"
    }

    let _tl_data = {};

    /** @type Function[] */
    let _tl_change_callback = [];

    /** @type Function[] */
    let _tl_load_callback = [];

    let _tl_language = "jp";
    let _tl_dl_finish = 0;
    let _tl_dl_task = 0;

    async function tl_load_all()
    {
        _tl_language = window.localStorage["_language"];
        if(_tl_language == undefined) _tl_language = "jp";
        for(let _ in _tl_names)
        {
            _tl_dl_task++;
        }

        for(let lang in _tl_names)
        {
            const ln = lang;
            fetch(_tl_names[ln]).then(rsp =>
            {
                if(!rsp.ok)
                {
                    console.error(`Cannot load translation for language ${ln}`);
                    return;
                }
                rsp.text().then((str) => 
                {
                    try 
                    {
                        var tldat = JSON.parse(str);
                        if(tldat["lang_name"] != undefined)
                        {
                            _tl_data[ln] = tldat;
                        }

                        if(ln == _tl_language)
                        {
                            _tl_call_change_callbacks();
                        }
                    }
                    catch(e)
                    {
                        console.error(`Failed to parse translation data for language ${ln} (${_tl_names[ln]}) - ${e}`)
                    }

                    _tl_dl_finish++;
                    if(_tl_dl_finish == _tl_dl_task)
                    {
                        _tl_call_load_callbacks();
                    }
                })
            });
        }
    }

    function _tl_call_load_callbacks()
    {
        for(var cb of _tl_load_callback)
        {
            cb();
        }
    }

    function _tl_call_change_callbacks()
    {
        for(var cb of _tl_change_callback)
        {
            cb();
        }
    }

    function tl_change(language)
    {
        window.localStorage["_language"] = _tl_language = language;
        _tl_call_change_callbacks();
    }

    function tl_register_on_change(callback)
    {
        _tl_change_callback.push(callback);
        callback();    
    }

    function tl_get_string(key, defval, lang = null)
    {
        if(lang == null) lang = _tl_language;
        if(_tl_data[lang] == undefined) return defval;
        if(_tl_data[lang][key] == undefined) return defval;
        return _tl_data[lang][key];
    }

    function tl_get_languages()
    {
        let retval = [];
        for(var n in _tl_names)
        {
            retval.push(n);
        }
        return retval;
    }

    function tl_register_on_load(fn)
    {
        if(_tl_dl_finish == _tl_dl_task)
        {
            fn();
        }else
        {
            _tl_load_callback.push(fn);
        }
    }

    function tl_get_current_language()
    {
        return _tl_language;
    }

    tl_load_all();

    return {
        get_string: tl_get_string,
        register_on_change: tl_register_on_change,
        register_on_load: tl_register_on_load,
        change: tl_change,
        get_languages : tl_get_languages,
        get_current_language : tl_get_current_language
    }
})();
