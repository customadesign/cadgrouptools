# Persona Templates

This directory holds the default AI persona templates for Murphy Consulting and eSystems Management. Each Markdown file maps to a specific intake form and uses GoHighLevel merge tokens so the content is populated automatically from submitted responses.

## How to Use
1. **Reference tokens:** Confirm each `{{ ... }}` token matches the custom field API keys or form field keys in your GoHighLevel account. Update the token names if your configuration differs.
2. **Copy into workflows:** Paste the desired persona template into MANUS AI prompts, workflow emails, or documentation steps that should render the default persona.
3. **Customize as needed:** Users can tailor the persona output for a specific client. Keep the Markdown files here unchanged so the defaults remain intact.

## API Access
The portal exposes these templates via:
- `GET /api/personas` — Returns a list of all available persona templates.
- `GET /api/personas/[id]` — Returns the full content of a specific persona template (e.g., `/api/personas/murphy-google-ads`).

Use these endpoints in the UI to load, preview, or restore default persona instructions.

## Restoring Defaults
If a template is modified elsewhere, return to this folder and copy the original Markdown back into your workflow. You can also restore the committed default from version control with `git checkout -- personas/<file>.md`.

## Adding New Templates
When new intake forms are created:
- Duplicate an existing Markdown file in this directory.
- Update the metadata (title, form URL, token list) to match the new form.
- Commit the file so the default remains available to the team.
