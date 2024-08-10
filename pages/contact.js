import {useState, useEffect} from "react"
import Head from "next/head";

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY // this may not always work, but I'm using this as an example of how you can store it

const Contact = props => {
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        message: "",
    });

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const renderTurnstile = () => {
            if (
                typeof window.turnstile !== "undefined" &&
                document.getElementById("turnstile-container")
            ) {
                window.turnstile.render("#turnstile-container", {
                    sitekey: turnstileSiteKey,
                    callback: function (token) {
                        setForm(prevForm => ({ ...prevForm, turnstileToken: token }));
                    },
                });
            }
        };

        if (typeof window.turnstile !== "undefined") {
            renderTurnstile();
        } else {
            const observer = new MutationObserver((mutations, obs) => {
                if (typeof window.turnstile !== "undefined") {
                    renderTurnstile();
                    obs.disconnect();
                }
            });
            observer.observe(document, {
                childList: true,
                subtree: true,
            });
        }

        return () => {
            if (typeof window.turnstile !== "undefined") {
                window.turnstile.remove("#turnstile-container");
            }
        };
    }, [showForm]);

    useEffect(() => {
        if (error) {
            setTimeout(() => {
                setError(null);
            }, 3000);
        }
    }, [success, error]);

    const handleReset = () => {
        setForm({
            name: "",
            email: "",
            message: "",
        });
        setShowForm(false);
        setSuccess(null);
        if (typeof window.turnstile !== "undefined") {
            window.turnstile.remove("#turnstile-container");
        }
    };

    const handleSubmit = async () => {
        // just some basic validation, but you can use formik or zod or whatever you generally use
        const isEmailValid = form.email.match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );

        if (!isEmailValid) {
            setError("Email is invalid");
            return;
        }

        if (!form.name || !form.email || !form.message) {
            setError("Missing required fields");
            return;
        }

        if (!form.turnstileToken) {
            setError("Solve the captcha before sending the form");
            return;
        }

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });
            const { error, message } = await response.json();
            if (error) {
                setError(message ?? error.message);
            } else {
                setSuccess(message);
            }
        } catch (error) {
            setError(error);
        }
    };

  return (
        <div className="App">
            <Head>
                <title>Example.com contact form</title>
                <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
            </Head>
            <div className='page'>
                <h1>Contact</h1>
                <div className="details">contact at example dot com</div>
                <div className="form-button"><button type="button" onClick={() => showForm(true)}>Open contact form</button></div>
                {error && <div className="error message">{error}</div>}
                {error && <div className="success message">{error}</div>}

                {/* you can use it like this or inside a modal */}
                {showForm && (
                    <div className='form'>
                        <div className='form-group'>
                            <label htmlFor='name'>Name:</label>
                            <input
                                type='text'
                                id='name'
                                name='name'
                                value={form.name}
                                onChange={e =>
                                    setForm({
                                        ...form,
                                        name: e.target.value,
                                    })
                                }
                            />
                        </div>
                      
                        <div className='form-group'>
                            <label htmlFor='email'>Email:</label>
                            <input
                                type='email'
                                id='email'
                                name='email'
                                value={form.email}
                                onChange={e =>
                                    setForm({
                                        ...form,
                                        email: e.target.value,
                                    })
                                }
                            />
                        </div>
                      
                        <div className='form-group'>
                            <label htmlFor='message'>Message:</label>
                            <textarea
                                id='message'
                                name='message'
                                value={form.message}
                                onChange={e =>
                                    setForm({
                                        ...form,
                                        message: e.target.value,
                                    })
                                }
                                rows={5}
                            ></textarea>
                        </div>
                      
                          <div className='form-actions'>
                              <button type='button' onClick={handleReset}>Reset Form</button>
                              <button type='button' onClick={handleSubmit}>Submit</button>
                          </div>
                      </div>
                </div>
           )}
    </div>
  )
}

export default Contact;
