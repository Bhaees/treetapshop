

## Lower Cash Threshold Minimum to 1 OMR

### What will change
The cash threshold input on the Owner Dashboard currently has a minimum value of **50 OMR**, which prevents you from setting it lower for testing. I will change this minimum to **1 OMR** so you can easily trigger WhatsApp alerts.

### Where the threshold is
The threshold input is on the **Owner Dashboard** page -- after logging in with the Owner PIN (1234), look for the "Today's Cash" card. The threshold number (default 200) is an editable field right there.

### Technical detail
- File: `src/pages/OwnerDashboard.tsx`, line 208
- Change `min={50}` to `min={1}`

