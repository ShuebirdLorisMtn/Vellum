# Vellum
AI Template Creation Agent 
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vellum — Fuck Your Cookie Cutter Template.</title>
    <meta name="description" content="Vellum is the world's first Cognitive Document Architect. Three questions. Perfect document. From custom hellraisers to polite praisers — we architect the document your situation demands. First one's free.">
    <style>
        :root {
            --bg: #07070a;
            --surface: #0f0f15;
            --surface-elevated: #181820;
            --border: #22222e;
            --border-light: #2e2e3c;
            --text: #e8e8ed;
            --text-secondary: #a0a0b0;
            --text-muted: #6b6b7c;
            --accent: #c9a96e;
            --accent-fire: #e85d3a;
            --accent-ice: #7eb8da;
            --accent-glow: rgba(201, 169, 110, 0.3);
            --accent-fire-glow: rgba(232, 93, 58, 0.25);
            --radius: 12px;
            --radius-lg: 20px;
            --transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.7;
            -webkit-font-smoothing: antialiased;
            overflow-x: hidden;
        }

        /* Aggressive ambient — fire and ice */
        body::before {
            content: '';
            position: fixed;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background:
                radial-gradient(ellipse at 20% 30%, rgba(232, 93, 58, 0.04) 0%, transparent 50%),
                radial-gradient(ellipse at 75% 70%, rgba(126, 184, 218, 0.03) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, rgba(201, 169, 110, 0.02) 0%, transparent 60%);
            pointer-events: none;
            z-index: 0;
            animation: ambientShift 20s ease-in-out infinite;
        }
        @keyframes ambientShift {
            0%,
            100% {
                transform: translate(0, 0);
            }
            33% {
                transform: translate(1.5%, -1%);
            }
            66% {
                transform: translate(-1%, 1.5%);
            }
        }

        .page-content {
            position: relative;
            z-index: 1;
        }

        /* ── NAV ── */
        .nav {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 100;
            padding: 1rem 2rem;
            background: rgba(7, 7, 10, 0.8);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid transparent;
            transition: var(--transition);
        }
        .nav.scrolled {
            border-bottom-color: var(--border);
        }
        .nav-inner {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .nav-logo {
            font-weight: 800;
            font-size: 1.3rem;
            letter-spacing: 0.05em;
            color: var(--accent);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .nav-logo .logo-mark {
            width: 30px;
            height: 30px;
            border-radius: 6px;
            background: linear-gradient(135deg, #c9a96e, #8b7335);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
            color: #0a0a0a;
            font-weight: 900;
        }
        .nav-cta {
            padding: 0.65rem 1.5rem;
            background: var(--accent-fire);
            color: #fff;
            border-radius: 8px;
            font-weight: 700;
            font-size: 0.9rem;
            text-decoration: none;
            letter-spacing: 0.03em;
            transition: var(--transition);
        }
        .nav-cta:hover {
            box-shadow: 0 6px 25px var(--accent-fire-glow);
            transform: translateY(-2px);
        }

        /* ── SECTIONS ── */
        .section {
            max-width: 1100px;
            margin: 0 auto;
            padding: 6rem 2rem;
        }

        /* ── HERO ── */
        .hero {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding-top: 5rem;
        }
        .hero-stamp {
            display: inline-block;
            padding: 0.5rem 1.2rem;
            background: rgba(232, 93, 58, 0.12);
            border: 1px solid rgba(232, 93, 58, 0.3);
            color: var(--accent-fire);
            font-weight: 700;
            font-size: 0.85rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            border-radius: 4px;
            margin-bottom: 1.5rem;
            animation: fadeInUp 0.8s ease;
        }
        .hero h1 {
            font-size: clamp(2.8rem, 8vw, 6rem);
            font-weight: 900;
            letter-spacing: -0.04em;
            line-height: 1.05;
            margin-bottom: 1.2rem;
            animation: fadeInUp 0.8s ease 0.1s both;
            text-transform: uppercase;
        }
        .hero h1 .line-strike {
            display: block;
            font-size: clamp(1.4rem, 3vw, 2rem);
            font-weight: 400;
            letter-spacing: 0.1em;
            color: var(--text-muted);
            text-decoration: line-through;
            text-decoration-color: var(--accent-fire);
            text-decoration-thickness: 3px;
            text-underline-offset: 10px;
            margin-bottom: 0.3rem;
        }
        .hero h1 .line-main {
            display: block;
            background: linear-gradient(135deg, #fff 0%, #d4b87a 50%, #e0c78a 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .hero .hero-tagline {
            font-size: 1.15rem;
            color: var(--text-secondary);
            max-width: 600px;
            margin-bottom: 2.5rem;
            animation: fadeInUp 0.8s ease 0.2s both;
            line-height: 1.6;
        }
        .hero .hero-tagline strong {
            color: var(--text);
        }
        .hero-cta-group {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            justify-content: center;
            animation: fadeInUp 0.8s ease 0.3s both;
        }
        .btn-fire {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 1.1rem 2.5rem;
            background: var(--accent-fire);
            color: #fff;
            font-size: 1.1rem;
            font-weight: 700;
            text-decoration: none;
            border-radius: 10px;
            letter-spacing: 0.03em;
            transition: var(--transition);
            border: none;
            cursor: pointer;
        }
        .btn-fire:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 35px var(--accent-fire-glow);
        }
        .btn-ghost {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 1.1rem 2.5rem;
            background: transparent;
            color: var(--text);
            font-size: 1.1rem;
            font-weight: 600;
            text-decoration: none;
            border-radius: 10px;
            letter-spacing: 0.03em;
            border: 1px solid var(--border-light);
            transition: var(--transition);
            cursor: pointer;
        }
        .btn-ghost:hover {
            border-color: var(--accent);
            background: rgba(201, 169, 110, 0.06);
        }
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(25px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* ── FREE FIRST DOCUMENT BANNER ── */
        .free-banner {
            background: linear-gradient(135deg, rgba(201, 169, 110, 0.1), rgba(232, 93, 58, 0.08));
            border: 1px solid rgba(201, 169, 110, 0.25);
            border-radius: var(--radius-lg);
            padding: 1.5rem 2rem;
            text-align: center;
            max-width: 700px;
            margin: 0 auto;
            animation: fadeInUp 0.8s ease 0.35s both;
        }
        .free-banner .free-badge {
            display: inline-block;
            background: var(--accent);
            color: #0a0a0a;
            font-weight: 800;
            font-size: 0.8rem;
            padding: 0.3rem 0.9rem;
            border-radius: 50px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            margin-bottom: 0.6rem;
        }
        .free-banner p {
            font-weight: 600;
            font-size: 1.05rem;
            color: var(--text);
        }
        .free-banner p span {
            color: var(--accent);
        }

        /* ── SPECTRUM SECTION ── */
        .spectrum-section {
            text-align: center;
        }
        .spectrum-section .section-label {
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: var(--text-muted);
            margin-bottom: 1rem;
        }
        .spectrum-section h2 {
            font-size: clamp(1.8rem, 4vw, 2.6rem);
            font-weight: 600;
            letter-spacing: -0.02em;
            margin-bottom: 3rem;
        }
        .spectrum-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 0.5rem;
            margin-bottom: 2rem;
            position: relative;
            overflow: hidden;
        }
        .spectrum-point {
            flex: 1;
            text-align: center;
            padding: 1rem 0.5rem;
            font-weight: 700;
            font-size: 0.85rem;
            letter-spacing: 0.03em;
            position: relative;
            z-index: 1;
            transition: var(--transition);
            cursor: default;
        }
        .spectrum-point.hellraiser {
            color: var(--accent-fire);
        }
        .spectrum-point.firm {
            color: #d4a574;
        }
        .spectrum-point.neutral {
            color: var(--accent);
        }
        .spectrum-point.polite {
            color: #b8a0d8;
        }
        .spectrum-point.praiser {
            color: var(--accent-ice);
        }
        .spectrum-slider {
            position: absolute;
            top: 8px;
            bottom: 8px;
            left: 2%;
            width: 18%;
            background: rgba(201, 169, 110, 0.1);
            border: 2px solid var(--accent);
            border-radius: 10px;
            z-index: 0;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .spectrum-examples {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 1rem;
            margin-top: 2rem;
        }
        .spectrum-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1.3rem;
            text-align: center;
            transition: var(--transition);
            cursor: default;
        }
        .spectrum-card:hover {
            border-color: var(--border-light);
            transform: translateY(-3px);
        }
        .spectrum-card .emoji {
            font-size: 1.6rem;
            margin-bottom: 0.5rem;
        }
        .spectrum-card h4 {
            font-weight: 700;
            font-size: 0.85rem;
            letter-spacing: 0.02em;
            margin-bottom: 0.3rem;
        }
        .spectrum-card p {
            font-size: 0.75rem;
            color: var(--text-muted);
            line-height: 1.5;
        }
        .spectrum-card.fire {
            border-left: 3px solid var(--accent-fire);
        }
        .spectrum-card.ice {
            border-left: 3px solid var(--accent-ice);
        }
        .spectrum-card.gold {
            border-left: 3px solid var(--accent);
        }

        /* ── THREE QUESTIONS ── */
        .three-questions {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 3rem 2.5rem;
            text-align: center;
        }
        .three-questions .section-label {
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: var(--accent-fire);
            margin-bottom: 0.8rem;
        }
        .three-questions h2 {
            font-size: clamp(1.6rem, 3.5vw, 2.2rem);
            font-weight: 600;
            letter-spacing: -0.02em;
            margin-bottom: 2.5rem;
        }
        .question-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            max-width: 650px;
            margin: 0 auto 2rem;
        }
        .question-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1.2rem 1.5rem;
            text-align: left;
            transition: var(--transition);
        }
        .question-item:hover {
            border-color: var(--accent);
            box-shadow: 0 0 20px var(--accent-glow);
        }
        .question-number {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(201, 169, 110, 0.1);
            border: 1px solid rgba(201, 169, 110, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            color: var(--accent);
            flex-shrink: 0;
            font-size: 0.95rem;
        }
        .question-text .q-label {
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--text-muted);
            margin-bottom: 0.2rem;
        }
        .question-text .q-example {
            font-size: 0.9rem;
            color: var(--text-secondary);
            font-style: italic;
        }

        /* ── USE CASES ── */
        .usecases-section {
            text-align: center;
        }
        .usecases-section .section-label {
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: var(--text-muted);
            margin-bottom: 1rem;
        }
        .usecases-section h2 {
            font-size: clamp(1.8rem, 4vw, 2.4rem);
            font-weight: 600;
            letter-spacing: -0.02em;
            margin-bottom: 2.5rem;
        }
        .usecase-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.2rem;
            text-align: left;
        }
        .usecase-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1.5rem;
            transition: var(--transition);
            position: relative;
            overflow: hidden;
        }
        .usecase-card:hover {
            border-color: var(--border-light);
            background: var(--surface-elevated);
        }
        .usecase-card .usecase-tag {
            display: inline-block;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            padding: 0.25rem 0.6rem;
            border-radius: 4px;
            margin-bottom: 0.8rem;
        }
        .usecase-card .usecase-tag.fire {
            background: rgba(232, 93, 58, 0.15);
            color: var(--accent-fire);
        }
        .usecase-card .usecase-tag.ice {
            background: rgba(126, 184, 218, 0.15);
            color: var(--accent-ice);
        }
        .usecase-card .usecase-tag.gold {
            background: rgba(201, 169, 110, 0.15);
            color: var(--accent);
        }
        .usecase-card h4 {
            font-weight: 700;
            font-size: 0.95rem;
            margin-bottom: 0.4rem;
        }
        .usecase-card p {
            font-size: 0.82rem;
            color: var(--text-muted);
            line-height: 1.6;
        }

        /* ── TESTIMONIALS ── */
        .testimonials {
            text-align: center;
        }
        .testimonials .section-label {
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: var(--text-muted);
            margin-bottom: 1rem;
        }
        .testimonials h2 {
            font-size: clamp(1.8rem, 4vw, 2.2rem);
            font-weight: 600;
            letter-spacing: -0.02em;
            margin-bottom: 2.5rem;
        }
        .testimonial-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            text-align: left;
        }
        .testimonial-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 2rem;
            transition: var(--transition);
        }
        .testimonial-card:hover {
            border-color: var(--border-light);
        }
        .testimonial-card .quote {
            font-size: 0.9rem;
            color: var(--text-secondary);
            font-style: italic;
            margin-bottom: 1.2rem;
            line-height: 1.7;
        }
        .testimonial-card .quote strong {
            color: var(--accent-fire);
            font-style: normal;
        }
        .testimonial-card .author {
            display: flex;
            align-items: center;
            gap: 0.7rem;
        }
        .testimonial-card .author-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--border);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.85rem;
            color: var(--text-muted);
        }
        .testimonial-card .author-info .name {
            font-weight: 600;
            font-size: 0.85rem;
        }
        .testimonial-card .author-info .role {
            font-size: 0.75rem;
            color: var(--text-muted);
        }

        /* ── CTA ── */
        .cta-section {
            text-align: center;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 4rem 2rem;
            position: relative;
            overflow: hidden;
        }
        .cta-section::before {
            content: '';
            position: absolute;
            top: -30%;
            left: 50%;
            transform: translateX(-50%);
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(232, 93, 58, 0.12) 0%, transparent 70%);
            pointer-events: none;
        }
        .cta-section .free-stamp {
            display: inline-block;
            background: var(--accent-fire);
            color: #fff;
            font-weight: 800;
            font-size: 0.9rem;
            padding: 0.4rem 1.2rem;
            border-radius: 50px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 1.5rem;
            position: relative;
            animation: pulseFire 2s infinite;
        }
        @keyframes pulseFire {
            0%,
            100% {
                box-shadow: 0 0 0 0 rgba(232, 93, 58, 0.4);
            }
            50% {
                box-shadow: 0 0 0 18px rgba(232, 93, 58, 0);
            }
        }
        .cta-section h2 {
            font-size: clamp(2rem, 5vw, 3.2rem);
            font-weight: 800;
            letter-spacing: -0.03em;
            position: relative;
            margin-bottom: 1rem;
            text-transform: uppercase;
        }
        .cta-section h2 span {
            color: var(--accent-fire);
        }
        .cta-section .cta-subtitle {
            color: var(--text-secondary);
            position: relative;
            margin-bottom: 2rem;
            font-size: 1.05rem;
            max-width: 550px;
            margin-left: auto;
            margin-right: auto;
        }
        .cta-section .btn-fire-large {
            display: inline-flex;
            align-items: center;
            gap: 0.6rem;
            padding: 1.3rem 3rem;
            background: var(--accent-fire);
            color: #fff;
            font-size: 1.2rem;
            font-weight: 800;
            text-decoration: none;
            border-radius: 12px;
            letter-spacing: 0.04em;
            transition: var(--transition);
            position: relative;
            text-transform: uppercase;
        }
        .cta-section .btn-fire-large:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 50px var(--accent-fire-glow);
        }
        .cta-section .cta-note {
            font-size: 0.8rem;
            color: var(--text-muted);
            margin-top: 1.2rem;
            position: relative;
        }

        /* ── FOOTER ── */
        .footer {
            text-align: center;
            padding: 3rem 2rem;
            border-top: 1px solid var(--border);
            color: var(--text-muted);
            font-size: 0.8rem;
            letter-spacing: 0.04em;
        }
        .footer a {
            color: var(--text-secondary);
            text-decoration: none;
            transition: var(--transition);
        }
        .footer a:hover {
            color: var(--accent-fire);
        }
        .footer .motto {
            font-weight: 700;
            color: var(--accent-fire);
            font-size: 0.9rem;
            letter-spacing: 0.06em;
            margin-bottom: 0.8rem;
            text-transform: uppercase;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
            .section {
                padding: 4rem 1.2rem;
            }
            .three-questions {
                padding: 2rem 1.2rem;
            }
            .nav {
                padding: 0.8rem 1.2rem;
            }
            .hero h1 {
                font-size: 2.2rem;
            }
            .hero h1 .line-strike {
                font-size: 1.1rem;
            }
            .spectrum-bar {
                flex-wrap: wrap;
                gap: 0.3rem;
            }
            .spectrum-point {
                font-size: 0.7rem;
                padding: 0.6rem 0.3rem;
            }
        }
    </style>
</head>
<body>

    <div class="page-content">

        <!-- Navigation -->
        <nav class="nav" id="nav">
            <div class="nav-inner">
                <a href="#" class="nav-logo">
                    <span class="logo-mark">V</span> Vellum
                </a>
                <a href="#cta" class="nav-cta">First Doc Free →</a>
            </div>
        </nav>

        <!-- Hero -->
        <section class="hero section">
            <div class="hero-stamp">⚠️ Not Your Grandma's Template</div>
            <h1>
                <span class="line-strike">Cookie Cutter Templates</span>
                <span class="line-main">Fuck Your Template.</span>
            </h1>
            <p class="hero-tagline">
                You got something to <strong>bitch about?</strong> Does the entire team need their <strong>ass reamed?</strong>
                Need a document so <strong>polite it curtsies?</strong> We got you.<br>
                From <strong>Custom Hellraisers to Polite Praisers</strong> — Vellum architects the exact document your situation demands.
                <strong>Three questions. That's it.</strong>
            </p>
            <div class="hero-cta-group">
                <a href="#cta" class="btn-fire">🔥 Raise Hell (Free)</a>
                <a href="#spectrum" class="btn-ghost">See the Spectrum ↓</a>
            </div>
            <div class="free-banner" style="margin-top: 2rem;">
                <span class="free-badge">First Document Free</span>
                <p>No credit card. No bullshit. <span>Just your perfect document.</span></p>
            </div>
        </section>

        <!-- The Spectrum -->
        <section class="spectrum-section section" id="spectrum">
            <p class="section-label">The Vellum Spectrum</p>
            <h2>From Hellraiser to Praiser.<br>We do it all.</h2>
            <div class="spectrum-bar" id="spectrumBar">
                <div class="spectrum-point hellraiser">🔥<br>Hellraiser</div>
                <div class="spectrum-point firm">⚡<br>Firm</div>
                <div class="spectrum-point neutral">🎯<br>Direct</div>
                <div class="spectrum-point polite">🤝<br>Polite</div>
                <div class="spectrum-point praiser">❄️<br>Praiser</div>
                <div class="spectrum-slider" id="spectrumSlider"></div>
            </div>
            <div class="spectrum-examples">
                <div class="spectrum-card fire">
                    <div class="emoji">🔥</div>
                    <h4>Team Ass-Reaming</h4>
                    <p>"Dear Team: The Q3 deliverables were a masterclass in how to torch stakeholder trust..."</p>
                </div>
                <div class="spectrum-card gold">
                    <div class="emoji">⚖️</div>
                    <h4>Conflict Resolution</h4>
                    <p>"This isn't about blame — it's about building a system where both sides win..."</p>
                </div>
                <div class="spectrum-card ice">
                    <div class="emoji">🤝</div>
                    <h4>Polite Praise</h4>
                    <p>"I wanted to take a moment to express my deepest appreciation for your extraordinary..."</p>
                </div>
            </div>
        </section>

        <!-- Three Questions -->
        <section class="three-questions section">
            <p class="section-label">How It Works</p>
            <h2>Three questions. That's literally it.</h2>
            <div class="question-list">
                <div class="question-item">
                    <div class="question-number">1</div>
                    <div class="question-text">
                        <div class="q-label">Who Are You?</div>
                        <div class="q-example">"Sarah Chen, VP of Engineering — and I'm pissed"</div>
                    </div>
                </div>
                <div class="question-item">
                    <div class="question-number">2</div>
                    <div class="question-text">
                        <div class="q-label">What's the Issue?</div>
                        <div class="q-example">"Q3 deadlines blown. Specs are garbage. Nobody's accountable."</div>
                    </div>
                </div>
                <div class="question-item">
                    <div class="question-number">3</div>
                    <div class="question-text">
                        <div class="q-label">What's the Desired Outcome?</div>
                        <div class="q-example">"A system where engineering and product stop pointing fingers and start shipping."</div>
                    </div>
                </div>
            </div>
            <p style="font-weight: 700; color: var(--accent); font-size: 1.1rem;">Vellum handles the rest. Your perfect document — delivered instantly.</p>
        </section>

        <!-- Use Cases -->
        <section class="usecases-section section">
            <p class="section-label">Who's It For?</p>
            <h2>Everyone. Literally everyone.</h2>
            <div class="usecase-grid">
                <div class="usecase-card">
                    <span class="usecase-tag fire">Hellraiser Mode</span>
                    <h4>The Pissed-Off Manager</h4>
                    <p>Your team blew the deadline. Again. You need a document that names names, lights fires, and makes the consequences crystal clear. Vellum delivers the scorched-earth memo they'll never forget.</p>
                </div>
                <div class="usecase-card">
                    <span class="usecase-tag gold">Direct Mode</span>
                    <h4>The CEO With No Time</h4>
                    <p>Board update in 30 minutes. You need a document that's sharp, strategic, and makes you look like the genius you are. No fluff. No filler. Just power.</p>
                </div>
                <div class="usecase-card">
                    <span class="usecase-tag ice">Polite Mode</span>
                    <h4>The Diplomat</h4>
                    <p>You need to say "no" to a powerful stakeholder — and make them thank you for it. Vellum crafts the velvet-glove rejection that preserves the relationship and your reputation.</p>
                </div>
                <div class="usecase-card">
                    <span class="usecase-tag fire">Hellraiser Mode</span>
                    <h4>The Founder Ready to Snap</h4>
                    <p>Your co-founder made a promise they couldn't keep. Clients are furious. You need a come-to-Jesus document that's part therapy, part ultimatum. Vellum architects it.</p>
                </div>
                <div class="usecase-card">
                    <span class="usecase-tag gold">Direct Mode</span>
                    <h4>The Freelancer</h4>
                    <p>Client's scope-creeping you into poverty. You need a boundary-setting document that's firm, professional, and gets you paid. Vellum's got your back.</p>
                </div>
                <div class="usecase-card">
                    <span class="usecase-tag ice">Polite Mode</span>
                    <h4>The Job Seeker</h4>
                    <p>You need a cover letter and negotiation email that makes you irresistible without sounding desperate. Vellum writes the document that opens doors.</p>
                </div>
            </div>
        </section>

        <!-- Testimonials -->
        <section class="testimonials section">
            <p class="section-label">Proof</p>
            <h2>What the early users say.</h2>
            <div class="testimonial-grid">
                <div class="testimonial-card">
                    <p class="quote">"I needed to <strong>ream my entire engineering team</strong> without getting HR called on me. Vellum wrote a document so perfectly balanced between 'you're fucked' and 'here's the way forward' that my CTO asked who my consultant was."</p>
                    <div class="author">
                        <div class="author-avatar">JD</div>
                        <div class="author-info">
                            <div class="name">James D.</div>
                            <div class="role">VP of Product</div>
                        </div>
                    </div>
                </div>
                <div class="testimonial-card">
                    <p class="quote">"I described a tense co-founder conflict. Vellum produced a resolution framework so good our <strong>actual mediator borrowed structure from it.</strong> I'm not kidding."</p>
                    <div class="author">
                        <div class="author-avatar">ML</div>
                        <div class="author-info">
                            <div class="name">Maya L.</div>
                            <div class="role">Startup Founder</div>
                        </div>
                    </div>
                </div>
                <div class="testimonial-card">
                    <p class="quote">"I asked for a <strong>polite but firm 'fuck off'</strong> to a client who hadn't paid in 90 days. The document Vellum wrote got me paid within 4 hours AND the client apologized. Black magic."</p>
                    <div class="author">
                        <div class="author-avatar">RK</div>
                        <div class="author-info">
                            <div class="name">Ryan K.</div>
                            <div class="role">Independent Consultant</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA -->
        <section class="cta-section section" id="cta">
            <span class="free-stamp">First Document Free</span>
            <h2>Stop Writing<br><span>Shitty Documents.</span></h2>
            <p class="cta-subtitle">
                You've got something to say. Say it with <strong>precision</strong> — whether that means
                burning bridges or building them. Vellum is your document architect.
                <br><br>
                <strong>First document is on us. No credit card. No risk. Just results.</strong>
            </p>
            <a href="#" class="btn-fire-large">🔥 Get Your Free Document Now</a>
            <p class="cta-note">Available on Whop. Unlimited documents. One price.</p>
        </section>

        <!-- Footer -->
        <footer class="footer">
            <p class="motto">Fuck Your Cookie Cutter Template.™</p>
            <p>Vellum — Cognitive Document Architecture™</p>
            <p style="margin-top: 0.5rem;">
                <a href="#">Privacy</a> · <a href="#">Terms</a> · <a href="#">Contact</a>
            </p>
        </footer>

    </div>

    <script>
        // Nav scroll effect
        const nav = document.getElementById('nav');
        window.addEventListener('scroll', () => {
            nav.classList.toggle('scrolled', window.scrollY > 50);
        });

        // Spectrum slider animation — moves on hover
        const spectrumBar = document.getElementById('spectrumBar');
        const spectrumSlider = document.getElementById('spectrumSlider');
        const spectrumPoints = spectrumBar.querySelectorAll('.spectrum-point');

        spectrumPoints.forEach((point, index) => {
            point.addEventListener('mouseenter', () => {
                const position = (index / (spectrumPoints.length - 1)) * 82; // 0% to 82%
                spectrumSlider.style.left = position + '%';
                spectrumSlider.style.borderColor = getComputedStyle(point).color;
                spectrumSlider.style.background = getComputedStyle(point).color.replace(')',
                    ', 0.12)').replace('rgb', 'rgba');
            });
        });

        spectrumBar.addEventListener('mouseleave', () => {
            spectrumSlider.style.left = '40%';
            spectrumSlider.style.borderColor = 'var(--accent)';
            spectrumSlider.style.background = 'rgba(201, 169, 110, 0.1)';
        });

        // Intersection Observer for scroll animations
        const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll(
            '.spectrum-card, .usecase-card, .testimonial-card, .question-item, .free-banner').forEach(
            el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(el);
            });

        // Trigger visible ones on load
        setTimeout(() => {
            document.querySelectorAll(
                '.spectrum-card, .usecase-card, .testimonial-card, .question-item, .free-banner')
                .forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.top < window.innerHeight) {
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                    }
                });
        }, 300);

        // Console easter egg
        console.log('%c Vellum %c Fuck Your Cookie Cutter Template.™ ',
            'background:#e85d3a;color:#fff;padding:10px 14px;font-weight:800;font-size:1.1em;border-radius:4px 0 0 4px;',
            'background:#0f0f15;color:#c9a96e;padding:10px 14px;font-weight:700;border-radius:0 4px 4px 0;');
        console.log('%cFirst document free. %cSee you on Whop.',
            'color:#e85d3a;font-size:1em;font-weight:700;', 'color:#999;');
    </script>

</body>
</html>
