// Writing a parser or a lexer or something

/* eslint-disable no-fallthrough */

/*
Test Cases:

// works
title="foo bar"
title="another title here"
title="A title with "double quotes in it""
*/
export let titleRegex = new RegExp('title="(.+)"');
/*
Test Cases:

// works
#foo
#bar
#foo#bar#blah
#foo #bar
#foo test here

// still works

#🧠
#it-works!!!

// doesn't work

### A heading
# A heading
## A heading
#### A heading

// doesn't work

[#foo](./within-a-link)
[foo](#within-a-link)

// doesn't work
`#foo`
*/
export let tagRegex = new RegExp("(?<![#[(])#([^#\\s]+)");
/**
 * Matches:
 *   **bold text**
 */
export let boldRegex = new RegExp("\\*\\*(.+)\\*\\*");
/**
 * Matches:
 *   __italics text__
 */
export let italicsRegex = new RegExp("__(.+)__");

/**
 * Matches:
 *   ~~striken text~~
 */
export let strikethroughRegex = new RegExp("~~(.+)~~");
/**
 * Matches:
 * Either a tab, or two spaces - 0 or more times
 * Either:
 *   [ ]
 *   [~]
 *   [X]
 *   [x]
 * Followed by a space, and then followed by any characters but not a tab or line break
 */
export let todoRegex = new RegExp("(\\t|\\s{2}){0,}\\[([ xX~])\\] (.+[^s])");
/**
 * Matches:
 * * thing
 *   * nested thing
 * - dash list
 *   - dash list
 */
export let regularBulletsRegex = new RegExp("^( {0,}[\\*\\-]) {0,}(.+)");
/**
 * Matches:
 * 1. Thing
 *   2. another thing
 * a. thing
 *   b. another thing
 * A. thing
 *   B. another
 */
export let characterBulletsRegex = new RegExp(
  "^( {0,})([a-zA-Z0-9])\\. {0,}(.+)"
);
/**
 * Matches:
 * `code`
 *
 * Does not match:
 * `code \`with\` escaped backticks` correctly
 */
export let inlineCodeRegex = new RegExp("`([^`]+)`");

/**
 * Matches:
 * [some link](anchor here)
 * [another](link) [here](too)
 * Doesn't Match:
 * ![some image](image.png)
 */
export let linkRegex = new RegExp("(?<!\\!)\\[(.*?)\\]\\((.*?)\\)");

/**
 * Matches:
 * ![some image](image.png)
 * Doesn't Match:
 * [some link](page)
 */
export let imageRegex = new RegExp("\\!\\[(.*?)\\]\\((.*?)\\)");
/**
 * Matches:
 * # A heading
 * ## A heading
 * ### A heading
 * #### A heading
 * ##### A heading
 * ###### A heading
 * ...
 *
 * Doesn't Match:
 * `# a heading`
 * #tag-here
 */
export let markdownHeadingRegex = new RegExp("(?<!`)(#+) (.*)");

/**
 * Matches:
 * ```
 * some code
 * ```
 * ```jsx
 * more code
 * ```
 * ~~~language
 * some more code
 * ~~~
 */
export let markdownCodeFenceRegex = new RegExp(
  "(```|~~~)(.*)\n([\\s\\S]*?\n)(```|~~~)"
);

/**
 * Matches:
 * ---
 * Doesn't Match:
 * - Foo
 * fjksnfkjdns --- dfskjnfjkdfn
 */
export let horizontalRuleRegex = new RegExp("^---$", "m");

/**
 * Matches:
 * !!foo!!
 */
export let markRegex = new RegExp("!!(.+)!!");

/**
 * Export regex
 * Matches:
 * export [name] = [value][units]
 * export weight = 100Lbs
 *   weight
 *   100
 *   Lbs
 */
export let exportRegex = new RegExp("export (.+) = ([0-9]+)([a-zA-Z.]+)");

/**
 * Due date regex
 * Matches:
 *
 * I need to do this thing @today
 * I need to do this thing @tomorrow
 */
export let dueDateRegex = new RegExp("@(today|tomorrow)");

// We have some input string, let's call it `input`

let input = `title="Foo"

#testing #tokenizer #tags-with-dashes

---

~~~jsx

let foo = 'bar';

~~~

\`\`\`tsx

let foo: string = 'bar';

\`\`\`

\`inline-code\`

---

- list item
  - nested list item
    - another list item

* List item
  * nested list item
    * another list item

1. Numbered list item
  2. Another numbered list item
    3. Yet another numbered list item

A. alpha list item
  B. alpha list item
    C. alpha list item


---

!!highlight text!!

**bold text**

~~strikethrough text~~

__italics text__

---

# Heading

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

---


[ ] Testing todos
  [ ] Nested todos

[~] indeterminate todo
  [x] done todo
    [x] todo
    [x] another todo
  [ ] todo

---

![](https://google.com/foo)

[google](https://google.com)

---

export weight = 100Lbs

export bloodGlucose = 89u

`;

console.log(input);

// Next we need to parse this string
// Parsing I guess means crawling the string and then returning some datastructure
function tokenizer(source) {
  // pointer to the current position in the string
  let current = 0;
  let tokens = [];
  let state = { text: "" };

  function insertRawParagraph() {
    if (state.text.length > 0) {
      tokens.push({
        type: "paragraph",
        children: state.text,
        loc: [current - state.text.length, current]
      });
      state.text = "";
    }
  }

  function getLocation(fullMatch) {
    return [current, current + fullMatch.length];
  }

  let tCharFallThrough = 0;

  while (current < source.length) {
    let char = source[current];

    let subStr = source.slice(current);

    switch (char) {
      // newlines
      case "\n": {
        insertRawParagraph();
        tokens.push({
          type: "line-break",
          raw: char,
          loc: [current, current + 1]
        });
        current++;
        break;
      }
      // title
      case "t": {
        let titleMatch = titleRegex.exec(subStr);
        console.log(titleMatch);
        if (titleMatch) {
          let { 0: fullMatch, 1: title } = titleMatch;
          tokens.push({
            type: "title",
            raw: fullMatch,
            title,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
        if (tCharFallThrough === 0) {
          tCharFallThrough = 1;
          console.log("Char t, fallthrough");
        }
      }
      // export
      case "e": {
        let match = exportRegex.exec(subStr);
        // not sure what is special with `7` here
        // but if we don't include that then we will find matches for any `e`
        // in the string, but just not the right time to find the match
        if (match) {
          let { 0: fullMatch, 1: name, 2: value, 3: units } = match;
          let loc = [current];
          current += fullMatch.length;
          loc.push(current);
          tokens.push({
            type: "export",
            raw: fullMatch,
            name,
            value,
            units,
            loc
          });
          break;
        }
      }
      // inline and block code elements
      case "`": {
        let codeBlockMatch = markdownCodeFenceRegex.exec(subStr);
        if (codeBlockMatch) {
          let { 0: fullMatch, 2: language, 3: code } = codeBlockMatch;

          tokens.push({
            type: "code-block",
            raw: fullMatch,
            language,
            code,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }

        let inlineCodeMatch = inlineCodeRegex.exec(subStr);
        if (inlineCodeMatch) {
          let { 0: fullMatch, 1: code } = inlineCodeMatch;

          tokens.push({
            type: "inline-code",
            raw: fullMatch,
            code,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
      }
      // bold and list elements
      case "*": {
        let boldMatch = boldRegex.exec(subStr);
        if (boldMatch) {
          let { 0: fullMatch, 1: children } = boldMatch;
          tokens.push({
            type: "bold",
            raw: fullMatch,
            children,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
      }
      case "-": {
        // horizontal rules
        let hrMatch = horizontalRuleRegex.exec(subStr);
        if (hrMatch) {
          let { 0: fullMatch } = hrMatch;
          tokens.push({
            type: "horizontal-rule",
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
      }
      // todo list or link elements
      case `[`: {
        // could be a todo list start or a link
      }
      // strikethrough or codefences
      case `~`: {
        // could be a strike through or an indeterminate checkbox or a codeblock
        let codeBlockMatch = markdownCodeFenceRegex.exec(subStr);
        if (codeBlockMatch) {
          let { 0: fullMatch, 2: language, 3: code } = codeBlockMatch;

          tokens.push({
            type: "code-block",
            raw: fullMatch,
            language,
            code,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }

        let strikethroughMatch = strikethroughRegex.exec(subStr);
        if (strikethroughMatch) {
          let { 0: fullMatch, 1: children } = strikethroughMatch;
          tokens.push({
            type: "strikethrough",
            raw: fullMatch,
            children,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
      }
      // italics
      case "_": {
        // could be italics
        let italicsMatch = italicsRegex.exec(subStr);
        if (italicsMatch) {
          let { 0: fullMatch, 1: children } = italicsMatch;
          tokens.push({
            type: "italics",
            raw: fullMatch,
            children,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
      }
      // highlight or image elements
      case "!": {
        // could be an image or a mark element
        let highlightMatch = markRegex.exec(subStr);
        if (highlightMatch) {
          let { 0: fullMatch, 1: children } = highlightMatch;
          tokens.push({
            type: "highlight",
            raw: fullMatch,
            children,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
      }

      // tags or markdown headings
      case "#": {
        let tagMatch = tagRegex.exec(subStr);
        if (tagMatch) {
          let { 0: fullMatch, 1: tag } = tagMatch;
          tokens.push({
            type: "tag",
            raw: fullMatch,
            tag,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          // console.log(input[current]);
          break;
        }
      }
      default: {
        if (tCharFallThrough === 1) {
          console.log("t char fallthrough to default");
          tCharFallThrough = 2;
          console.log({ char, current });
        }
        state.text += char;
        if (current === input.length - 1 && state.text.length > 0) {
          insertRawParagraph();
        }
        current++;
      }
    }
  }
  return tokens;
}

let output = tokenizer(input);
output.forEach((token) => {
  if (token.type === "paragraph") {
    console.log(token);
  }
});
