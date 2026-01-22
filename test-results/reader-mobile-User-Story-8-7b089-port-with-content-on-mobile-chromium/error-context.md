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
    - generic [ref=e7]:
      - button "Switch to dark theme" [ref=e9]:
        - img
      - button "User menu" [ref=e11]:
        - generic [ref=e12]: A
  - main [ref=e13]:
    - main [ref=e16]:
      - generic [ref=e17]:
        - button "Open navigation menu" [ref=e18]:
          - img [ref=e19]
        - navigation "Breadcrumb" [ref=e20]:
          - button "Go to root" [ref=e21]:
            - img [ref=e22]
        - button "Switch to reading mode" [ref=e27]:
          - img [ref=e28]
      - generic [ref=e36]:
        - img [ref=e38]
        - heading "Select a document" [level=2] [ref=e41]
        - paragraph [ref=e42]: Choose a file from the navigation panel to view its contents. You can browse folders by clicking on them to expand.
        - generic [ref=e43]:
          - img [ref=e44]
          - generic [ref=e46]: Click a file in the sidebar
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e52] [cursor=pointer]:
    - img [ref=e53]
  - alert [ref=e56]
```