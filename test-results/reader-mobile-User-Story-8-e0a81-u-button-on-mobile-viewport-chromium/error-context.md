# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - navigation "Main navigation" [ref=e2]:
    - generic [ref=e3]:
      - button "Toggle navigation menu" [ref=e4]:
        - img
      - link "Cemdash Home Dashboard - Go to home page" [ref=e5] [cursor=pointer]:
        - /url: /
        - generic [ref=e6]: Cemdash
    - button "Switch to dark theme" [ref=e9]:
      - img
  - main [ref=e10]:
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]: Welcome back
        - generic [ref=e15]: Enter your email and password to access the calendar
      - form "Sign in form" [ref=e17]:
        - generic [ref=e18]:
          - text: Email
          - textbox "Email" [ref=e19]:
            - /placeholder: admin@home.local
        - generic [ref=e20]:
          - text: Password
          - textbox "Password" [ref=e21]:
            - /placeholder: ••••••••
        - button "Sign in" [ref=e22]
  - region "Notifications alt+T"
  - alert [ref=e23]
```