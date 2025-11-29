
        // Set current year automatically
        document.getElementById('year').textContent = new Date().getFullYear();

        // --- (بداية كود اللغة والأكشن) ---

        const langBtn = document.getElementById('langToggle');
        // تعديل: إضافة العناصر الجديدة القابلة للترجمة
        const translatableElements = document.querySelectorAll("[data-ar]");
        const inputElements = document.querySelectorAll("[data-placeholder-ar]");

        function getInitialLang() {
            const savedLang = localStorage.getItem('siteLang');
            if (savedLang === 'ar' || savedLang === 'en') {
                return savedLang;
            }
            const browserLang = navigator.language || navigator.userLanguage;
            if (browserLang.startsWith('ar')) {
                return 'ar';
            }
            return 'en';
        }
        
        let currentLang = getInitialLang();

        function updateLanguage() {
            document.documentElement.setAttribute("lang", currentLang);
            document.documentElement.setAttribute("dir", currentLang === 'ar' ? 'rtl' : 'ltr');
            langBtn.textContent = currentLang === 'ar' ? "EN" : "عربي";
            localStorage.setItem('siteLang', currentLang);

            translatableElements.forEach(el => {
                // هذا المنطق للتعامل مع العناصر التي تحتوي على <span> بداخلها (مثل الهيرو)
                const textSpan = el.querySelector('span[data-ar]');
                if (textSpan) {
                        if (el.dataset[currentLang]) {
                        const spanToUpdate = Array.from(el.childNodes).find(node => node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SPAN');
                        if (spanToUpdate) {
                            spanToUpdate.textContent = el.dataset[currentLang];
                        }
                    }
                } 
                // هذا المنطق للتعامل مع الأزرار الاجتماعية
                else if (el.classList.contains('social-btn')) {
                    const span = el.querySelector('span');
                    if (span && span.dataset[currentLang]) {
                        span.textContent = span.dataset[currentLang];
                    }
                }
                // هذا المنطق لباقي العناصر
                else if (el.dataset[currentLang]) {
                    el.textContent = el.dataset[currentLang];
                }
            });

            inputElements.forEach(el => {
                el.placeholder = el.dataset['placeholder' + currentLang.charAt(0).toUpperCase() + currentLang.slice(1)];
            });
            
            // (تم حذف كود تحديث نصيحة اليوم)
        }

        langBtn.addEventListener('click', () => {
            currentLang = currentLang === 'ar' ? 'en' : 'ar';
            document.body.classList.add('lang-fade-out');
            setTimeout(() => {
                updateLanguage(); 
                document.body.classList.remove('lang-fade-out'); 
            }, 150); 
        });

        document.addEventListener('DOMContentLoaded', updateLanguage);

        // --- (نهاية كود اللغة والأكشن) ---

        // --- (بداية كود Gemini API) ---

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=`;
        const API_KEY = ""; // اترك هذا فارغاً كما هو

        /**
         * دالة بسيطة لتحويل الماركداون (النص العريض والأسطر الجديدة) إلى HTML
         */
        function parseMarkdown(text) {
            return text
                .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // تحويل **bold** إلى <b>bold</b>
                .replace(/\n/g, '<br>'); // تحويل الأسطر الجديدة إلى <br>
        }

        /**
         * دالة استدعاء Gemini API مع معالجة الأخطاء ومؤشر التحميل
         */
        async function callGemini(systemPrompt, userPrompt, loaderElement, resultContainer, resultTextElement) {
            loaderElement.style.display = 'block';
            resultContainer.style.display = 'none'; // إخفاء الحاوية القديمة
            resultTextElement.innerHTML = ''; // مسح النتائج القديمة

            const payload = {
                contents: [{ parts: [{ text: userPrompt }] }],
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
            };

            let retries = 3;
            let delay = 1000;

            while (retries > 0) {
                try {
                    const response = await fetch(API_URL + API_KEY, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json();
                    
                    if (result.candidates && result.candidates[0].content.parts[0].text) {
                        const generatedText = result.candidates[0].content.parts[0].text;
                        resultTextElement.innerHTML = parseMarkdown(generatedText);
                        resultContainer.style.display = 'block'; // إظهار النتائج
                    } else {
                        throw new Error("Invalid API response structure.");
                    }
                    
                    loaderElement.style.display = 'none';
                    return; // نجح الاتصال، اخرج من الدالة

                } catch (error) {
                    console.error("Error calling Gemini API:", error);
                    retries--;
                    if (retries === 0) {
                        loaderElement.style.display = 'none';
                        resultTextElement.textContent = currentLang === 'ar' ? 'حدث خطأ أثناء محاولة الاتصال. يرجى المحاولة مرة أخرى.' : 'An error occurred. Please try again.';
                        resultContainer.style.display = 'block';
                    } else {
                        await new Promise(resolve => setTimeout(resolve, delay));
                        delay *= 2; // Exponential backoff
                    }
                }
            }
        }

        // --- 1. ميزة: نصيحة اليوم ---
        // (تم حذف كود نصيحة اليوم)

        // --- 2. ميزة: تحليل المشروع ---
        const analyzeBtn = document.getElementById('analyzeBtn');
        const analysisLoader = document.getElementById('analysisLoader');
        const analysisResult = document.getElementById('analysisResult');
        const analysisResultText = document.getElementById('analysisResultText');
        const msgTextarea = document.getElementById('msg');
        
        analyzeBtn.addEventListener('click', handleAnalyzeProject);

        function handleAnalyzeProject() {
            const projectDescription = msgTextarea.value;

            if (projectDescription.trim().length < 10) {
                analysisResultText.textContent = currentLang === 'ar' ? 'يرجى كتابة وصف أطول للمشروع.' : 'Please write a longer project description.';
                analysisResult.style.display = 'block';
                return;
            }

            const systemPrompt = `You are a senior project manager specializing in programming and cybersecurity. Analyze the following client project request. Respond in the same language as the request.
Your analysis must be concise (max 100 words) and formatted using Markdown. Provide:
1. **Key Services:** (e.g., Web Development, Cybersecurity Audit, Penetration Testing, etc.)
2. **Estimated Complexity:** (Simple, Medium, Complex)
3. **Clarifying Questions:** (2-3 short, important questions to ask the client for more details)`;

            callGemini(systemPrompt, projectDescription, analysisLoader, analysisResult, analysisResultText);
        }

        // --- (نهاية كود Gemini API) ---


        // Intersection observer for section animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("reveal");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        document.querySelectorAll("section").forEach(sec => observer.observe(sec));

        // Gentle entrance animation for cards
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduceMotion) {
            document.querySelectorAll('.card').forEach((card, index) => {
                card.animate([
                    { transform: 'translateY(14px)', opacity: 0 },
                    { transform: 'translateY(0)', opacity: 1 }
                ], { 
                    duration: 700, 
                    easing: 'cubic-bezier(.22,1,.36,1)',
                    delay: index * 100 
                });
            });
        }

        // Hamburger menu functionality
        const menuToggle = document.getElementById('menu-toggle');
        const navLinks = document.querySelector('.nav-links');

        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
        
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });

        // Fake form submission for demo
        function fakeSend() {
            const statusEl = document.getElementById('formStatus');
            const submitBtn = document.querySelector('.form button[type="submit"]');
            const originalBtnText = submitBtn.dataset[currentLang];

            // إخفاء نتائج التحليل عند الإرسال
            document.getElementById('analysisResult').style.display = 'none';

            if (currentLang === 'ar') {
                statusEl.textContent = 'جاري الإرسال...';
                submitBtn.textContent = 'جاري الإرسال...';
            } else {
                statusEl.textContent = 'Sending...';
                submitBtn.textContent = 'Sending...';
            }
            submitBtn.disabled = true;

            setTimeout(() => {
                if (currentLang === 'ar') {
                    statusEl.textContent = 'تم الإرسال بنجاح!';
                } else {
                    statusEl.textContent = 'Sent successfully!';
                }
                statusEl.style.color = 'var(--brand-2)';
                
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;

                // مسح الفورم بعد الإرسال
                document.getElementById('name').value = '';
                document.getElementById('email').value = '';
                document.getElementById('msg').value = '';

                setTimeout(() => {
                    statusEl.textContent = '';
                }, 3000);

            }, 1500);
        }
        // --- START: Animation for "Start Now" button ---
        document.addEventListener('DOMContentLoaded', () => {
            const startNowButton = document.querySelector('.hero .btn-primary');

            if (startNowButton) {
                startNowButton.addEventListener('click', function(event) {
                    event.preventDefault(); 

                    const targetId = this.getAttribute('href');
                    const targetElement = document.querySelector(targetId);

                    // Add a class to trigger the animation
                    this.classList.add('animating-out');

                    // When the animation finishes, scroll to the target section
                    this.addEventListener('animationend', () => {
                        if (targetElement) {
                            targetElement.scrollIntoView({ behavior: 'smooth' });
                        }
                        
                        // Use a timeout to remove the class, allowing the button to reappear
                        // if the user scrolls back up.
                        setTimeout(() => {
                            this.classList.remove('animating-out');
                        }, 500);

                    }, { once: true }); // The event listener runs only once
                });
            }
        });
        // --- END: Animation for "Start Now" button ---
    