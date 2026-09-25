"""Interaction tests: theme, navigation, mobile menu, FAQ, forms, payment links."""

from urllib.parse import unquote

from harness import RAZORPAY_URL, SupabaseMock, new_context

CONTACT_OK = {
    "#contact-name": "Asha Verma",
    "#contact-email": "asha@example.com",
    "#contact-phone": "+91 98765 43210",
    "#contact-message": "We need a booking web app with WhatsApp reminders.",
}


def fill(page, values):
    for selector, value in values.items():
        page.fill(selector, value)


def test_theme(browser, base, report):
    ctx = new_context(browser, "desktop", SupabaseMock(), color_scheme="light")
    page = ctx.new_page()
    page.goto(base + "/index.html")
    root = page.locator("html")
    report.check(root.get_attribute("data-theme") == "light", "theme: follows OS light preference on first visit")
    page.click("[data-theme-toggle]")
    report.check(root.get_attribute("data-theme") == "dark", "theme: toggle switches to dark")
    report.check(page.evaluate("localStorage.getItem('theme')") == "dark", "theme: choice saved to localStorage")
    report.check(page.get_attribute("[data-theme-toggle]", "aria-pressed") == "true", "theme: aria-pressed reflects state")
    page.goto(base + "/terms.html")
    report.check(page.locator("html").get_attribute("data-theme") == "dark", "theme: persists across pages")
    ctx.close()


def test_navigation(browser, base, report):
    ctx = new_context(browser, "desktop", SupabaseMock())
    page = ctx.new_page()
    page.goto(base + "/index.html")
    page.click(".site-nav__link[href='#services']")
    page.wait_for_timeout(900)
    report.check(page.evaluate("location.hash") == "#services", "nav: desktop link updates hash")
    top = page.evaluate("document.getElementById('services').getBoundingClientRect().top")
    report.check(0 <= top < 140, "nav: section scrolls below the fixed header", f"top={top}")
    report.check(page.locator(".site-header").evaluate("e => e.classList.contains('is-scrolled')"), "nav: header gains scrolled state")
    page.mouse.wheel(0, 200)
    page.wait_for_timeout(500)
    report.check(page.locator(".site-nav__link.is-active").count() >= 1, "nav: active section is highlighted")

    page.goto(base + "/index.html")
    page.keyboard.press("Tab")
    report.check(page.evaluate("document.activeElement.classList.contains('skip-link')"), "a11y: first Tab reaches skip link")
    page.keyboard.press("Enter")
    report.check(page.evaluate("location.hash") == "#main", "a11y: skip link jumps to main content")
    ctx.close()


def test_mobile_menu(browser, base, report):
    ctx = new_context(browser, "mobile", SupabaseMock())
    page = ctx.new_page()
    page.goto(base + "/index.html")
    toggle = page.locator("[data-menu-toggle]")
    report.check(page.locator(".site-nav").is_hidden(), "menu: desktop nav hidden on mobile")
    toggle.click()
    page.wait_for_timeout(350)
    report.check(toggle.get_attribute("aria-expanded") == "true", "menu: toggle sets aria-expanded")
    report.check(page.locator("#mobile-menu").is_visible(), "menu: panel visible when open")
    report.check(page.evaluate("document.documentElement.classList.contains('menu-open')"), "menu: page scroll locked")
    report.check(page.evaluate("!!document.activeElement.closest('#mobile-menu')"), "menu: focus moves into menu")
    page.keyboard.press("Escape")
    page.wait_for_timeout(350)
    report.check(toggle.get_attribute("aria-expanded") == "false", "menu: Escape closes")
    report.check(page.evaluate("document.activeElement.matches('[data-menu-toggle]')"), "menu: focus returns to toggle")
    toggle.click()
    page.wait_for_timeout(350)
    page.click("#mobile-menu a[href='#faq']")
    page.wait_for_timeout(900)
    report.check(toggle.get_attribute("aria-expanded") == "false", "menu: closes after choosing a link")
    report.check(page.evaluate("location.hash") == "#faq", "menu: link navigates to section")
    ctx.close()


def test_faq(browser, base, report):
    ctx = new_context(browser, "desktop", SupabaseMock())
    page = ctx.new_page()
    page.goto(base + "/index.html#faq")
    first, second = page.locator("#faq-1-btn"), page.locator("#faq-2-btn")
    report.check(first.get_attribute("aria-expanded") == "true" and page.locator("#faq-1").is_visible(), "faq: first answer open by default")
    report.check(not page.locator("#faq-2").is_visible(), "faq: other answers collapsed")
    second.click()
    page.wait_for_timeout(400)
    report.check(second.get_attribute("aria-expanded") == "true" and page.locator("#faq-2").is_visible(), "faq: click opens answer")
    report.check(first.get_attribute("aria-expanded") == "false" and not page.locator("#faq-1").is_visible(), "faq: single-open closes the previous answer")
    second.focus()
    page.keyboard.press("Enter")
    page.wait_for_timeout(400)
    report.check(second.get_attribute("aria-expanded") == "false", "faq: keyboard toggles answer")
    ctx.close()


def test_contact_form(browser, base, report):
    supa = SupabaseMock()
    ctx = new_context(browser, "desktop", supa)
    page = ctx.new_page()
    page.goto(base + "/index.html#contact")
    submit = page.locator("#contact-form [type=submit]")

    submit.click()
    report.check(page.get_attribute("#contact-name", "aria-invalid") == "true", "contact: empty submit flags name")
    report.check("valid email" in page.inner_text("#contact-email-error") or "email" in page.inner_text("#contact-email-error"), "contact: email error shown")
    report.check(page.inner_text("#contact-message-error") != "", "contact: message error shown")
    report.check(page.evaluate("document.activeElement.id") == "contact-name", "contact: focus moves to first invalid field")
    report.check(len(supa.requests) == 0, "contact: nothing sent while invalid")

    fill(page, {**CONTACT_OK, "#contact-email": "not-an-email"})
    submit.click()
    report.check("valid email" in page.inner_text("#contact-email-error"), "contact: rejects malformed email")
    page.fill("#contact-email", CONTACT_OK["#contact-email"])
    report.check(page.inner_text("#contact-email-error") == "", "contact: error clears once corrected")

    page.select_option("#contact-service", label="Web Development")
    page.select_option("#contact-budget", index=2)
    supa.mode = "ok"
    submit.click()
    page.wait_for_selector("#contact [data-form-success]:not([hidden])", timeout=5000)
    report.check(page.locator("#contact-form").is_hidden(), "contact: success replaces the form")
    sent = supa.requests[-1]
    report.check(sent["table"] == "contact_submissions" and sent["method"] == "POST", "contact: writes to contact_submissions")
    report.check(set(sent["body"]) == {"name", "email", "phone", "subject", "message"}, "contact: payload matches existing table columns", sent["body"])
    report.check("Web Development" in sent["body"]["subject"] and "Budget:" in sent["body"]["message"], "contact: service & budget captured")

    page.click("#contact [data-form-reset]")
    report.check(page.locator("#contact-form").is_visible() and page.input_value("#contact-name") == "", "contact: 'send another' resets the form")

    fill(page, CONTACT_OK)
    supa.mode = "error"
    submit.click()
    page.wait_for_selector("#contact-form [data-form-error]:not([hidden])", timeout=5000)
    wa = unquote(page.get_attribute("#contact-form [data-error-link=whatsapp]", "href"))
    report.check("Asha Verma" in wa and "booking web app" in wa, "contact: error offers prefilled WhatsApp fallback")
    report.check(page.input_value("#contact-message") == CONTACT_OK["#contact-message"], "contact: input kept after a failed send")
    report.check(not submit.is_disabled(), "contact: button re-enabled after failure")

    supa.mode = "network"
    submit.click()
    page.wait_for_timeout(600)
    report.check(page.locator("#contact-form [data-form-error]").is_visible(), "contact: network failure shows error state")

    count = len(supa.requests)
    page.evaluate("document.getElementById('contact-website').value = 'spam'")
    supa.mode = "ok"
    submit.click()
    page.wait_for_selector("#contact [data-form-success]:not([hidden])", timeout=5000)
    report.check(len(supa.requests) == count, "contact: honeypot submissions are not stored")
    ctx.close()


def test_newsletter(browser, base, report):
    supa = SupabaseMock()
    ctx = new_context(browser, "mobile", supa)
    page = ctx.new_page()
    page.goto(base + "/index.html")
    form = "form[data-form=newsletter]"
    page.fill(f"{form} input[type=email]", "bad@")
    page.click(f"{form} [type=submit]")
    report.check(page.inner_text("#newsletter-email-error") != "", "newsletter: invalid email rejected")
    for mode, expect_tone in [("ok", "success"), ("duplicate", "success"), ("error", "error")]:
        supa.mode = mode
        page.fill(f"{form} input[type=email]", "Reader@Example.com")
        page.click(f"{form} [type=submit]")
        page.wait_for_function("document.querySelector('[data-form-status]').dataset.tone", timeout=5000)
        tone = page.get_attribute("[data-form-status]", "data-tone")
        report.check(tone == expect_tone, f"newsletter: {mode} response shows {expect_tone} state", tone)
        page.fill(f"{form} input[type=email]", "")
    report.check(supa.requests[0]["body"] == {"email": "reader@example.com"}, "newsletter: stores lower-cased email only")
    ctx.close()


def test_demo_form(browser, base, report, path="/book-demo.html"):
    supa = SupabaseMock()
    ctx = new_context(browser, "mobile", supa)
    page = ctx.new_page()
    page.goto(base + path + "#request-form")
    page.fill("#demo-name", "Rahul Sharma")
    page.fill("#demo-business", "Apex Tech Solutions")
    page.fill("#demo-email", "rahul@apex.example")
    page.fill("#demo-phone", "+91 98765 43210")
    page.check("[data-mirror-source]")
    report.check(page.input_value("#demo-whatsapp") == "+91 98765 43210", f"demo{path}: 'same as phone' copies number")
    page.select_option("#demo-budget", index=2)
    page.fill("#demo-requirements", "A modern homepage for our IT services firm with a clear enquiry form.")

    supa.mode = "error"
    page.click("#demo-form [type=submit]")
    page.wait_for_selector("#demo-form [data-form-error]:not([hidden])", timeout=5000)
    report.check(page.get_attribute("#demo-form [data-error-link=payment]", "href") == RAZORPAY_URL, f"demo{path}: error state still offers payment")
    report.check("Apex Tech" in unquote(page.get_attribute("#demo-form [data-error-link=whatsapp]", "href")), f"demo{path}: error state offers WhatsApp with details")

    supa.mode = "ok"
    page.click("#demo-form [type=submit]")
    page.wait_for_selector("[data-form-success]:not([hidden])", timeout=5000)
    body = supa.requests[-1]["body"]
    expected = {"full_name", "business_name", "email", "phone", "whatsapp", "budget_range", "requirements"}
    report.check(supa.requests[-1]["table"] == "demo_requests" and set(body) == expected, f"demo{path}: payload matches demo_requests columns", body)
    pay = page.locator("[data-form-success] .payment-btn")
    report.check(pay.get_attribute("href") == RAZORPAY_URL and pay.get_attribute("target") == "_blank", f"demo{path}: success shows Razorpay payment link")
    ctx.close()


def test_payment_links(browser, base, report):
    ctx = new_context(browser, "desktop", SupabaseMock())
    page = ctx.new_page()
    page.goto(base + "/book-demo.html")
    links = page.locator("a.payment-btn")
    hrefs = {links.nth(i).get_attribute("href") for i in range(links.count())}
    report.check(hrefs == {RAZORPAY_URL}, "payment: every payment button points to the Razorpay link", hrefs)
    opened = []
    ctx.on("page", lambda p: opened.append(p))
    button = page.locator(".offer a.payment-btn")
    button.scroll_into_view_if_needed()
    button.click()
    page.wait_for_timeout(1200)
    report.check(len(opened) == 1, "payment: click opens exactly one checkout tab (old double-open bug fixed)", f"opened={len(opened)}")
    ctx.close()


def test_not_found(browser, base, report):
    ctx = new_context(browser, "desktop", SupabaseMock())
    page = ctx.new_page()
    resp = page.goto(base + "/this/page/does-not-exist")
    report.check(resp.status == 404 and "couldn’t find" in page.inner_text("h1"), "404: styled not-found page served")
    styled = page.evaluate("getComputedStyle(document.querySelector('.btn--primary')).backgroundColor")
    report.check(styled not in ("rgba(0, 0, 0, 0)", "transparent"), "404: styles load from a nested URL", styled)
    page.click("text=Back to homepage")
    page.wait_for_load_state()
    report.check(page.url == base + "/" and page.locator("#hero-title").count() == 1, "404: homepage link works", page.url)
    ctx.close()


def run_all(browser, base, report):
    for test in (test_theme, test_navigation, test_mobile_menu, test_faq, test_contact_form,
                 test_newsletter, test_demo_form, test_payment_links, test_not_found):
        print(f"\n▸ {test.__name__}")
        try:
            test(browser, base, report)
        except Exception as err:  # keep going so one broken test doesn't hide the rest
            report.check(False, f"{test.__name__} crashed", repr(err))
    print("\n▸ test_demo_form (/book-demo/ mirror)")
    try:
        test_demo_form(browser, base, report, path="/book-demo/")
    except Exception as err:
        report.check(False, "test_demo_form mirror crashed", repr(err))
