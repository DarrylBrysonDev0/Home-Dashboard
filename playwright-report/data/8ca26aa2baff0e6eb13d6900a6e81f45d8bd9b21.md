# Page snapshot

```yaml
- generic [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - heading "Home Dashboard" [level=1] [ref=e5]
      - button "Switch to light theme" [active] [ref=e7]:
        - img
  - generic [ref=e9]:
    - generic [ref=e10]:
      - generic [ref=e11]: Welcome back
      - generic [ref=e12]: Enter your email and password to access the calendar
    - form "Sign in form" [ref=e14]:
      - generic [ref=e15]:
        - text: Email
        - textbox "Email" [ref=e16]:
          - /placeholder: admin@home.local
      - generic [ref=e17]:
        - text: Password
        - textbox "Password" [ref=e18]:
          - /placeholder: ••••••••
      - button "Sign in" [ref=e19]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e25] [cursor=pointer]:
    - img [ref=e26]
  - alert [ref=e29]
```