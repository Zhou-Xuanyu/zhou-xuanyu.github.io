---
title: "md-lite.nvim: My First Nvim Plugin Attempt"
layout: layouts/thought.html
extra_css: css/thoughts.css
tags: thoughts
post_date: "May 26, 2026"
---

## My problem with nvim and markdown

I write markdown in nvim.
I used to write with
[render-markdown.nvim](https://github.com/MeanderingProgrammer/render-markdown.nvim)
which is a very powerful project that renders markdown elements in real time.
(it can even render latex.)
It indeed provides amazing markdown editing experience
but it felt like overkill for me.
[Markdown](https://daringfireball.net/projects/markdown/)
is a format (not even a language) that was designed to be read as plain text.
The excess rendering looks fancy
but what I want is something simple and just enough.
So I stopped using it and went straight back to plain-text.

In 99% of the cases, it works and works really well.
However, there is one, just one particular situation 
that shows the limitation of plain text in my use.

I write my todo list in markdown and it looks like the following.

```markdown
# Todo
## Queue(not stack, hopefully)
1. md-lite thoughts
1. something else I need to do
1. another example
```

It is an ordered list in markdown.
Ideally, the first thing I put on that list get done first
(
[FIFO](https://en.wikipedia.org/wiki/FIFO_(computing_and_electronics))
).
But the reality is that the so called queue is really flexible in practice.
Sometimes, I do multitasking, sometimes I simply find something more interesting
and finish that thing first.
So the order of the list changes from time to time 
and it is impossible for me to mark them manually.
When I was using `render-markdown.nvim`, I had no problem,
as I only need to write every item with `1.`,
it will automatically render it in order.
Since, currently I am working with plain text,
I can no longer use this feature.
But I really feel that I need something like this.
So I decided to make a bare minimum plugin to solve this problem.

I know that `render-markdown.nvim` might support to disable
all other features and only enable list rendering,
but since my use case is very limited, 
why not do it myself and take the chance to try something new.

## The plugin

Now, we will walk through the plugin part by part.
Lua is a fairly simple language, so for most of the code,
anyone can directly get the meaning without any comments.
So I will basically show the code in a logical order and only explain
the non-obvious details.

### General Structure

A typical nvim plugin looks something like this.

```bash
❯ tree
.
├── LICENSE
├── lua
│   └── md_lite
│       └── init.lua
├── plugin
│   └── md_lite.lua
└── README.md

4 directories, 4 files
```

In fact, you don't need all these at all.
The key file is the `md_lite.lua` file inside `plugin` folder.
That is where nvim looks. 
In theory, just like a normal nvim config file(
[my complete nvim config](https://github.com/Zhou-Xuanyu/nvim-config)
), we can do a single file plugin.
However, just in case, my plugin grows larger later
(which is actually not what I want, since minimum is the goal),
I followed the convention.

### The Handler File

Now let us look into the handler file `md_lite.lua`

```lua
local md_lite = require("md_lite")

vim.api.nvim_create_autocmd({ "BufWinEnter", "TextChanged" }, {
    pattern = "*.md",
    callback = function() 
        md_lite.render(vim.api.nvim_get_current_buf()) 
    end
})

local last_line
vim.api.nvim_create_autocmd("CursorMoved", {
    pattern = "*.md",
    callback = function()
        local line = vim.api.nvim_win_get_cursor(0)[1]
        if line == last_line then return end -- column move, skip
        last_line = line
        md_lite.render(vim.api.nvim_get_current_buf())
    end
})
```

Basically, this file is just a trigger.
We imported the actual renderer from `md_lite` folder and then
use `autocmd` to run the renderer under specific circumstances
including `BufWinEnter`, `TextChanged` and `CursorMoved`.
Do note that cursor movement detection is really sensitive.
So I added a limitation to consider only row movement to debounce.

### The Renderer File

Looking at the `init.lua` file in `md_lite` folder.
This is the file that actually gets the job done.
At the end we have a `return`. 
That is what the handler file actually get during `require`
As we can see it is a lua table with only one element
that is our render function.
Yes, in theory, we can simply `return render` and then
directly call `md_lite` instead of `md_lite.render` in our handler file.
However, as the project may grow larger, we might need to call 
more than one function so I followed convention of returning a table here.

```lua
local ns = vim.api.nvim_create_namespace("md_lite")

local function render(buf)
    vim.api.nvim_buf_clear_namespace(buf, ns, 0, -1)
    local lines = vim.api.nvim_buf_get_lines(buf, 0, -1, false)
    local cursor_line = vim.api.nvim_win_get_cursor(0)[1]
    render_list(buf, lines, cursor_line)
end
return { render = render }
```

In the file, we created a unique namespace which is used to 
identify the rendered marks created by our plugin
so that we don't accidentally change or delete other plugins' work.

`render` is also kind of a handler function that feeds the information that
we need via nvim's native APIs and pass them to `render_list`
Note, the first command we call in `render()` is clear, 
so if we don't specify our namespace,
we will clear other people's work.

```lua
local function render_list(buf, lines, cursor_line)
    local i = 1
    local counts = {}
    while i <= #lines do
        local line = lines[i]
        local spaces = line:match("^(%s*)%d+%.")

        if spaces ~= nil then
            local offset = #spaces
            if counts[offset] == nil then
                counts[offset] = 1
            else
                counts[offset] = counts[offset] + 1
            end

            -- clear inner count whenever outer increment
            for k in pairs(counts) do
                if k > offset then counts[k] = nil end
            end

            -- cursor_line 1 based
            if i ~= cursor_line then
                local count = counts[offset]
                -- nvim api 0 based
                vim.api.nvim_buf_set_extmark(buf, ns, i - 1, offset, {
                    virt_text = { { count .. ".", "@markup.list" } },
                    virt_text_pos = "overlay",
                })
            end
        else
            counts = {}
        end
        i = i + 1
    end
end
```

Our render logic is pretty straight-forward. 
We loop through all the lines.
If we find a pattern like `(somespaces)1. `, we know
the current line is a part of an ordered list.
We also create a lua table `counts` to store key value pairs.
The key is the number of spaces before the number which basically
represents the depth of the item.
The value is the number of items of that depth.
Then we use `nvim_buf_set_extmark` APIs to render the count above existing text
at the appropriate position.
Then we clear `counts` when we encounter a line that is not part of a list.
That is how markdown separates different lists.

Do note that, lua is a language that widely use 1-based index, 
which is weird choice but true,
but nvim's built-in APIs uses 0-based as usual.

## The End

That is it. A very limited but indeed useful plugin.
The experience uncovers the mystery about nvim plugins 
to a certain extent for me.
They are just Lua with nvim APIs.
Also, Lua is a really interesting language.
It is simple but still effective.
It supports some really fancy features like
[labels](http://lua-users.org/wiki/GotoStatement).
It makes me feel like writing assembly
and provides an extended amount of flexibility.
But it also uses 1-based index
which is fine but conflicts with nvim's API and becomes annoying.
