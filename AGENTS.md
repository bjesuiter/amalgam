# Agents

## Project Conventions

- **Package Manager**: bun (use `bun` instead of `npm` or `pnpm`)
- **Beans**: After creating or updating beans, always commit and push the bean file(s)

## Documentation References

This project includes documentation for the following protocols and tools:

### ACP (Agent Control Protocol)
- Location: `docs/acp/`
- Overview, protocol specifications, and TypeScript library documentation

### exe.dev
- Location: `docs/exe/all.md`
- Complete exe.dev documentation

### TanStack
- Location: `docs/tanstack/llms.txt`
- TanStack ecosystem documentation (Router, Query, Start, etc.)

## Browser Testing with Playwriter

When available, use the **playwriter MCP server** to visually inspect and test changes in the browser:

- Use `mcp_playwriter_execute` to control the browser via Playwright code snippets
- Take screenshots with `screenshotWithAccessibilityLabels({ page })` to verify UI changes
- Use `accessibilitySnapshot({ page })` to understand page structure and find elements
- Interact with elements using `aria-ref` locators from the accessibility snapshot

**Fallback**: If playwriter is not available, use the `agent-browser` skill instead:
- Load the skill with `/agent-browser` 
- Provides similar browser automation capabilities
- DO NOT use `playwright-mcp`, it's very token heavy

This is especially useful for:
- Verifying frontend changes render correctly
- Testing user flows end-to-end
- Debugging layout/styling issues
- Taking screenshots for documentation
- 
## Work on next ticket 
If the user tells you to "work on the next ticket" or "next step" or "next phase", get the most important ticket from your perspective from beans and work on it. Work ONLY on one ticket at the same time.
If you realize you need to do another thing, create a new ticket for this. 
When you finish a ticket successfully, mark the ticket as done in beans and Commit and Push afterwards. 
Use ultrawork.

## Default Ralp-Loop Prompt 
Get the most important ticket from your perspective from beans and work on it. Work ONLY on one ticket at the same time.
If you realize you need to do another thing, create a new ticket for this. 
When you finish a ticket successfully, mark the ticket as done in beans and Commit and Push afterwards. 
You're done when all tickets are implemented or the user stops you manually.
Use ultrawork.

## Default Ralp-Loop Prompt 
Get the most important ticket from your perspective from beans and work on it. Work ONLY on one ticket at the same time.
If you realize you need to do another thing, create a new ticket for this. 
When you finish a ticket successfully, mark the ticket as done in beans and Commit and Push afterwards. 
You're done when all tickets are implemented or if the user stops you explicitely.
Use ultrawork.

## Integration Testing Ralph-Loop 
Look at the served website via playwrighter. Caution: you do not have exclusive access to playwrighter! ALWAYS verify that you use the right tab with your website in it (basically based on the port number, or the header on the page).
Test every ticket in beans, which is marked as done and validate it as a user would. 
If the test works, add this result to the ticket and mark it as "ai verified".
If it does not, create a new ticket in beans as a bug for later inspection, 
mark the ticket as "broken" and store the followup inspection ticket as a link, then go on to test the next ticket.
You're done if every ticket which is currently marked as done is marked as "ai verified" or "broken".
Use ultrawork.
