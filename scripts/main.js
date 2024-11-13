class WeightTableModel
{
    /** @type {number} */ min;
    /** @type {number} */ max;
    /** @type {number} */ bonus;
    /** @type {number} */ multi;
    /** @type {number} */ reduce;
}

class EvalTableRank 
{
    /** @type {string} */ rank;
    /** @type {number} */ minimum;
    /** @type {string} */ id;

    constructor(rank, minimum, id)
    {
        this.rank = rank;
        this.minimum = minimum;
        this.id = id;
    }
}

class App
{
    static INT_MAX = 0xFFFFFFFF;
    static INT_MIN = -0xFFFFFFFF;

    static difficulty_stat_limit = [ 1000, 1500, 1800 ];
    static final_exam_rank_bonus = [ 1700, 900, 500, 0,0,0 ];

    /** @type {EvalTableRank[]} */
    static eval_table_rank =
    [
        new EvalTableRank("S+", 14500, "ss"),
        new EvalTableRank("S",  13000, "s"),
        new EvalTableRank("A+", 11500, "aa"),
        new EvalTableRank("A",  10000, "a"),
        new EvalTableRank("B+",  8000, "bb"),
        new EvalTableRank("B",   6000, "b"),
        new EvalTableRank("C+",  4500, "cc"),
        new EvalTableRank("C",   3000, "c"),
        // All below table rank most likely wrong
        new EvalTableRank("D+",  2000, "dd"),
        new EvalTableRank("D",   1500, "d"),
        new EvalTableRank("E",   1000, "e"),
        new EvalTableRank("F",    500, "f"),
        new EvalTableRank("N/A",    0, "n"),
    ];

    /** @type {WeightTableModel[]} */
    static fxs_weight_table = [
    //  Min, Max, Bonus, Multi, Reduce
        { min : 0,     max : 5000,        bonus : 1500, multi : 0.30, reduce: 1500 },
        { min : 5000,  max : 10000,       bonus : 750,  multi : 0.15, reduce: 750  },
        { min : 10000, max : 20000,       bonus : 0,    multi : 0.08, reduce: 800  },
        { min : 20000, max : 30000,       bonus : 0,    multi : 0.04, reduce: 400  },
        { min : 30000, max : 40000,       bonus : 0,    multi : 0.02, reduce: 200  },
        { min : 40000, max : App.INT_MAX, bonus : 0,    multi : 0.01, reduce: 0    },
    ];

    static DIFFICULTY = 
    {
        REGULAR : 0,
        PRO : 1,
        MASTER : 2,
    };

    static algo_update_date = new Date(2024, 8, 30);

    constructor()
    {
        Object.seal(this.INT_MAX);
        Object.seal(this.INT_MIN);
        Object.seal(this.DIFFICULTY);
        Object.seal(this.difficulty_stat_limit);
        Object.seal(this.final_exam_rank_bonus);
        Object.seal(this.eval_table_rank);
        Object.seal(this.fxs_weight_table);
        Object.seal(this.algo_update_date);

        tl.register_on_change(() => { window.document.title = tl.get_string("title", "学マス計算機"); });
        this.remove_no_js();
        this.check_and_set_night();
        this.make_ui();
    }

    /** @type {HTMLDivElement} */ root;
    /** @type {HTMLDivElement} */ content;
    /** @type {HTMLDivElement} */ header;
    /** @type {HTMLElement} */ footer;
    /** @type {HTMLDivElement} */ title_container;
    /** @type {HTMLSpanElement} */ title;
    /** @type {HTMLImageElement} */ icon;
    /** @type {HTMLDivElement} */ header_tool;
    /** @type {HTMLSelectElement} */ tl_selector;


    /** @type {HTMLInputElement} */  fr_input; 
    /** @type {HTMLInputElement} */  fs_input; 
    /** @type {HTMLInputElement} */  vo_input; 
    /** @type {HTMLInputElement} */  da_input; 
    /** @type {HTMLInputElement} */  vi_input;
    /** @type {HTMLInputElement} */  cb_bonus;
    /** @type {HTMLSpanElement[]} */ rank_score_projection_names = [];
    /** @type {HTMLSpanElement} */   result_status;
    /** @type {HTMLSpanElement} */   result_status_bonus;
    /** @type {HTMLSpanElement} */   final_score_point;
    /** @type {HTMLSpanElement} */   final_rank_point;
    /** @type {HTMLSpanElement} */   total_point;
    /** @type {HTMLSpanElement} */   eval_rank;

    /** @type {HTMLSelectElement} */ produce_diff_select;

    /** Make UI */
    make_ui()
    {
        // Make base app

        /** @type {App} */
        var _this = this;
        this.root = el.make("div", "page_root");

        this.content = el.make("div", "app_root");

        pageRoot.add(this.root);

        // Make header
        this.header = el.make("div", "header_main");
        this.footer = el.make("span", "footer_main");
        this.footer.addClasses(["footer"]);

        this.title_container = el.make("div", "header_title_container");
        this.title = el.span("header_title", "学マス計算機");
        this.icon = el.image("./icon.png", "header_icon");
        this.header_tool = el.make("div", "header_tool");

        this.root.add(this.header);
        this.root.add(this.content);
        this.root.add(this.footer);

        this.header_tool.add(el.btn("btn_night_switch", "", 
            (evt) => { _this.switch_night(); }));

        this.header.add(this.title_container);
        this.title_container.add(this.icon);
        this.title_container.add(this.title);
        this.header.add(this.header_tool);

        this.make_update_tl_innerhtml(this.footer, "data_formula_notice", "Footer");
        this.make_update_tl_innertext(this.title, "title", "学マス計算機");

        this.tl_selector = this.make_select(
            "tl_selector", this.header_tool, 
            _this.make_lang_option);

        this.tl_selector.addEventListener("change", (evt) => {
            tl.change(evt.target.value);
        });

        // Update Date
        var data_date_h = el.span("data_updated_date", `Updated : ${App.algo_update_date.toDateString()}`);
        tl.register_on_change(() => 
        {
            var str = tl.get_string("data_updated_date", "Updated : {date}");
            data_date_h.innerText = str.format({date : App.algo_update_date.toLocaleDateString()});
        });
        this.content.add(data_date_h);

        // Produce Options
        this.produce_header = el.header(3, "produce", "");
        this.make_update_tl_innertext(this.produce_header, "produce", "");
        this.content.add(this.produce_header);

        this.produce_table = el.make("table", "produce_info_kvp");
        this.content.add(this.produce_table);

        this.produce_diff_select = this.make_form_select_row(
            "produce_difficulty_select", 
            "produce_difficulty_label", 
            "difficulty", "難易度", 
            this.produce_table, this.make_difficulty_option);
        
        // Final Rank
        this.final_rank_header = el.header(3, "head_final_rank", "最終試験");
        this.make_update_tl_innertext(this.final_rank_header, "final_exam", "最終試験");
        this.content.add(this.final_rank_header);

        var rank_table = el.make("table", "final_rank_kvp");
        this.content.add(rank_table);

        this.fr_input = this.make_form_select_row(
            "final_rank_select", "final_rank_label", 
            "final_exam_rank", "順位", rank_table, 
            _this.make_final_rank_option);

        this.fs_input = this.make_form_row(
            "final_score_input", "number", 
            "final_score_label", "final_exam_score", "スコア", 
            this.setup_final_score_limit, rank_table);

        // Status Header
        var status_header = el.header(3, "status_header", "ステータス");
        this.make_update_tl_innertext(status_header, "status", "ステータス");
        this.content.add(status_header);

        var status_code = el.make("span", "status_info");
        tl.register_on_change(() => 
        {
            status_code.innerText = tl.get_string("status_info", "(!)");
        });
        this.content.add(status_code);

        var status_table = el.make("table", "status_table_kvp");
        this.content.add(status_table);

        function stlm(el)
        {
            _this.setup_stat_limit(el);
        }

        this.vo_input = this.make_form_row("status_vo_label", "number",   "status_vo_input", "status_vo", "ボーカル (Vo)",     stlm, status_table);
        this.da_input = this.make_form_row("status_da_label", "number",   "status_da_input", "status_da", "ダンス (Da)",       stlm, status_table);
        this.vi_input = this.make_form_row("status_vi_label", "number",   "status_vi_input", "status_vi", "ビジュアル (Vi)",    stlm, status_table);
        this.cb_bonus = this.make_form_row("status_30_label", "checkbox", "status_30_bonus", "status_30", "+30ボーナス加算後",  () => {}, status_table)
        this.cb_bonus.checked = true;
            
        // Result
        var result_header = el.header(3, "result_header", "評価点換算");
        this.make_update_tl_innertext(result_header, "result", "評価点換算");
        this.content.add(result_header);

        var result_table = el.make("table", "result_table");
        this.content.add(result_table);

        this.result_status       = this.make_form_span_row("status_point_pre",  "status_point_pre_label",  "status_point_pre",  "ステータスポイント", result_table, this.set_span_zero);
        this.final_score_point   = this.make_form_span_row("final_score_point", "final_score_point_label", "final_score_point", "最終試験スコアポイント", result_table, this.set_span_zero);
        this.final_rank_point    = this.make_form_span_row("final_rank_point",  "final_rank_point_label",  "final_rank_point",  "最終試験順位ポイント", result_table, this.set_span_zero);
        this.total_point         = this.make_form_span_row("total_point",       "total_point_label",       "total_point",       "合計点", result_table, this.set_span_zero);
        this.eval_rank           = this.make_form_span_row("point_rank",        "point_rank_label",        "point_rank",        "評価ランク", result_table, this.set_rank_na);

        var spro_header = el.header(3, "spro_table", "各ランクまで必要な最終試験のスコア");
        this.make_update_tl_innertext(spro_header, "score_projection", "各ランクまで必要な最終試験のスコア");
        this.content.add(spro_header);

        this.spro_table = el.make("table", "spro_table");
        this.content.add(this.spro_table);

        this.rank_score_projection_names = 
        {
            ss: this.make_form_span_row_2("point_rank_ss", "point_rank_ss_label", undefined, "S+", this.spro_table, this.set_span_zero),
            s : this.make_form_span_row_2("point_rank_s",  "point_rank_s_label",  undefined, "S",  this.spro_table, this.set_span_zero),
            aa: this.make_form_span_row_2("point_rank_aa", "point_rank_aa_label", undefined, "A+", this.spro_table, this.set_span_zero),
            a : this.make_form_span_row_2("point_rank_a",  "point_rank_a_label",  undefined, "A",  this.spro_table, this.set_span_zero),
            bb: this.make_form_span_row_2("point_rank_bb", "point_rank_bb_label", undefined, "B+", this.spro_table, this.set_span_zero),
            b : this.make_form_span_row_2("point_rank_b",  "point_rank_b_label",  undefined, "B",  this.spro_table, this.set_span_zero),
            cc: this.make_form_span_row_2("point_rank_cc", "point_rank_cc_label", undefined, "C+", this.spro_table, this.set_span_zero),
            c : this.make_form_span_row_2("point_rank_c",  "point_rank_c_label",  undefined, "C",  this.spro_table, this.set_span_zero),
            dd: this.make_form_span_row_2("point_rank_dd", "point_rank_dd_label", undefined, "D+", this.spro_table, this.set_span_zero),
            d : this.make_form_span_row_2("point_rank_d",  "point_rank_d_label",  undefined, "D",  this.spro_table, this.set_span_zero),
            e : this.make_form_span_row_2("point_rank_e",  "point_rank_e_label",  undefined, "E",  this.spro_table, this.set_span_zero),
            f : this.make_form_span_row_2("point_rank_f",  "point_rank_f_label",  undefined, "F",  this.spro_table, this.set_span_zero),
        };

        for(var rsp in this.rank_score_projection_names)
        {
            var sp = this.rank_score_projection_names[rsp][0];
            sp.addClasses(["eval_rank", "eval_rank_small"]);
            sp.setAttribute("v", rsp[0]);
        }

        for(let it of [
            this.vo_input, this.da_input, this.vi_input, this.cb_bonus,
            this.produce_diff_select, this.fs_input, this.fr_input
        ])
        {
            it.addEventListener("change", (evt) => 
            {
                _this.do_update();
            });
        }

        tl.register_on_change(() => 
        {
            _this.do_update();
        });

        this.do_update();
    }

    make_lang_option()
    {
        var retval = [];
        var langs = tl.get_languages();
    
        langs.forEach((lang) => 
        {
            retval.push({
                value: lang,
                text: lang,
                tl_id: "lang_name",
                tl_lang: lang,
                default: lang == tl.get_current_language()
            });
        });
    
        return retval;
    }

    make_difficulty_option()
    {
        return [
            {
                text: "REGULAR",
                value: App.DIFFICULTY.REGULAR,
                tl_id: "difficulty_regular",
            },
            {
                text: "PRO",
                value: App.DIFFICULTY.PRO,
                tl_id: "difficulty_pro",
                default: true
            },
            {
                text: "MASTER",
                value: App.DIFFICULTY.MASTER,
                tl_id: "difficulty_master"
            }
        ];
    }

    make_final_rank_option()
    {
        var opts = [];

        for(var i = 1; i <= 6; i++)
        {
            opts.push({
                value: i,
                text: i,
                default: i == 1,
                lang_id: null,
                tl_id: null
            });
        }

        return opts;
    }

    remove_no_js()
    {
        {
            var sl = pageRoot.querySelector(".hidden_no_js");
            if(sl != null)
            {
                sl.remove();
            }
        }
    }

    check_and_set_night()
    {
        if(window.localStorage["is_night"] == "true")
        {
            if(!pageRoot.classList.contains("night"))
            {
                pageRoot.addClasses(["night"]);
            }
        }
    }
    
    set_rank(t, n)
    {
        this.eval_rank.innerText = t;
        this.eval_rank.setAttribute("v", n);
    }

    set_span_zero(_el)
    {
        _el.innerText = "0";
    }

    set_rank_na(_el)
    {
        _el.addClasses(["eval_rank"]);
        _el.innerText = "N/A";
        _el.setAttribute("v", "n");
    }

    do_update()
    {
        var vo_v = parseInt(this.vo_input.value);
        var da_v = parseInt(this.da_input.value);
        var vi_v = parseInt(this.vi_input.value);
        var diff = parseInt(this.produce_diff_select.value);
        var fscr = parseInt(this.fs_input.value);
        var rank = parseInt(this.fr_input.value);
        var a_30 = this.cb_bonus.checked;
        this.calculate_eval_score(diff, rank, fscr, vo_v, da_v, vi_v, a_30);
    }

    setup_stat_limit(el)
    {
        var _this = this;
        el.min = 0;
        el.max = 1500;
        el.value = 1000;
        function do_limit()
        {
            var idx = parseInt(_this.produce_diff_select.value);
            el.value = Math.max(Math.min(el.value, el.max = App.difficulty_stat_limit[idx]), el.min);
        }
        this.produce_diff_select.addEventListener("change", do_limit);
        do_limit();
        el.put_strict_number_limit();
    }

    setup_final_score_limit(el)
    {
        el.min = 0;
        el.max = App.INT_MAX;
        el.value = 10000;
        el.put_strict_number_limit();
    }

    make_update_tl_innertext(obj, tl_id, tl_ori_text)
    {
        tl.register_on_change(() => {
            obj.innerText = tl.get_string(tl_id, tl_ori_text);
        });
    }
    
    make_update_tl_innerhtml(obj, tl_id, tl_ori_text)
    {
        tl.register_on_change(() => {
            obj.innerHTML = tl.get_string(tl_id, tl_ori_text);
        });
    }
    
    make_form_row(label_id, type, input_id, tl_id, tl_ori, setup, table)
    {
        var label = el.make("label", label_id);
        tl.register_on_change(() => {
            label.innerText = tl.get_string(tl_id, tl_ori);
        });
    
        var input = el.input(input_id, type, setup);
        label.for = input.id;
    
        table.add(el.input_row(label, input));
        return input;
    }

    make_select(select_id, parent, make_option)
    {
        var select = el.make("select", select_id);
        make_option().forEach((it, _) => 
        {
            var fs = el.make("option");
            fs.value = it.value;
            fs.innerText = it.text;
            select.add(fs);
            if(it.default)
            {
                fs.setAttribute("selected", "selected");
            }

            if(it.tl_id != null)
            {
                if(it.tl_lang == null)
                {
                    tl.register_on_change(() => 
                    {
                        fs.innerText = tl.get_string(it.tl_id, it.text);
                    });
                }
                else
                {
                    tl.register_on_change(() => 
                    {
                        fs.innerText = tl.get_string(it.tl_id, it.text, it.tl_lang);
                    });
                }
            }
        });

        if(parent != undefined)
        {
            parent.add(select);
        }
        return select;
    }

    make_form_select_row(select_id, label_id, tl_id, tl_ori_text, table, make_option)
    {
        var label = el.make("label", label_id);
        tl.register_on_change(() => 
        {
            label.innerText = tl.get_string(tl_id, tl_ori_text);
        });

        var select = this.make_select(select_id, undefined, make_option);
        label.for = select_id;

        table.add(el.input_row(label, select));
        return select;
    }

    make_form_span_row(span_id, label_id, tl_id, tl_ori_text, table, configure)
    {
        var label = el.make("label", label_id);
        var span = el.make("span", label_id);
        this.make_update_tl_innertext(label, tl_id, tl_ori_text);
        configure(span);

        label.for = span_id;

        table.add(el.input_row(label, span));
        return span;
    }

    make_form_span_row_2(span_id, label_id, tl_id, tl_ori_text, table, configure)
    {
        var label = el.make("label", label_id);
        var span = el.make("span", label_id);
        this.make_update_tl_innertext(label, tl_id, tl_ori_text);
        configure(span);

        label.for = span_id;

        table.add(el.input_row(label, span));
        return [label, span];
    }

    switch_night()
    {
        if(pageRoot.classList.contains("night"))
        {
            pageRoot.delClasses(["night"]);
            window.localStorage["is_night"] = "false";
        }else
        {
            pageRoot.addClasses(["night"]);
            window.localStorage["is_night"] = "true";
        }
    }

    add_status_bonus(status, difficulty, bonus_30)
    {
        var max = App.difficulty_stat_limit[difficulty];
        
        if(!bonus_30) return Math.min(status, max);

        return Math.min(status + 30, max);
    }

    calculate_required_score(vo, da, vi, rank_score)
    {
        for(let key in this.rank_score_projection_names)
        {
            /** @type {EvalTableRank} */
            const rtable = App.eval_table_rank.find(it => it.id == key);
            if(rtable == null || rtable == undefined) continue;
            const txtData = this.rank_score_projection_names[key];
            const status_value = Math.floor(vo + da + vi ) * 2.3;
            const target_value = rtable.minimum - status_value - rank_score;
            
            let accum_reduce = 0;
            let limit_multi = 0.01;
            let limit_lbase = 40000;
            for(let limit of App.fxs_weight_table)
            {
                if(target_value <= accum_reduce + limit.reduce)
                {
                    limit_lbase = limit.min;
                    limit_multi = limit.multi;
                    break;
                }
                accum_reduce += limit.reduce;
            }

            const target_score = Math.ceil(((target_value - accum_reduce) / limit_multi) + limit_lbase);

            var str = target_score > 0 ? `${target_score}` : tl.get_string("rank_score_clear", "クリア！");
            txtData[1].innerText = str;
        }
    }

    // Main Algorithm Here
    calculate_eval_score(difficulty, final_exam_rank, final_exam_score, vo, da, vi, bonus_30)
    {
        var status_total = (
            this.add_status_bonus(vo, difficulty, bonus_30) + 
            this.add_status_bonus(da, difficulty, bonus_30) + 
            this.add_status_bonus(vi, difficulty, bonus_30)) 
            * 2.3;
        status_total = Math.ceil(status_total);
        var exam_rank_point = App.final_exam_rank_bonus[final_exam_rank - 1];
        var exam_score_point = final_exam_score;
        var exam_score_accum = 0;
        for(var tab of App.fxs_weight_table)
        {
            if(final_exam_score >= tab.min && tab.max > final_exam_score)
            {
                exam_score_point = ((final_exam_score - tab.min) * tab.multi);
                break;
            }
            exam_score_accum += tab.bonus;
        }

        var ttp = Math.floor(exam_rank_point + exam_score_accum + exam_score_point + status_total);
        this.total_point.innerText = `${ttp}`;
        this.final_rank_point.innerText = exam_rank_point;
        this.final_score_point.innerText = exam_score_point + exam_score_accum;
        this.result_status.innerText = `${status_total}`;

        for(let si = 0; si < App.eval_table_rank.length; si++)
        {
            var ca = App.eval_table_rank[si];
            if(ttp > ca.minimum)
            {
                this.set_rank(ca.rank, ca.id[0]);
                break;
            }
        }

        this.calculate_required_score(
            this.add_status_bonus(vo, difficulty, bonus_30), 
            this.add_status_bonus(da, difficulty, bonus_30), 
            this.add_status_bonus(vi, difficulty, bonus_30), 
            exam_rank_point);
    }

}

_instance = new App()
