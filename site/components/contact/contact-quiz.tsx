"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePostHog } from "posthog-js/react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  CheckIcon,
  MapPinIcon,
  PhoneIcon,
  XMarkIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import { AddressSearch } from "./address-search";
import { ServiceMap } from "./service-map";
import { DeviceCount } from "./device-count";
import {
  emptyAddress,
  contactIntentFromSearch,
  INTAKE_VARIANT,
  serviceOptions,
  propertyOptions,
  timingOptions,
  type ServiceAddress,
} from "@/lib/contact-intake";
import { prepareUploads, formatFileSize } from "@/lib/contact-uploads";
import {
  readContactResponse,
  describeNetworkFailure,
} from "@/lib/contact-response";
import { safeCapture } from "@/lib/analytics/safe-capture";
import { useAnalyticsReady } from "@/lib/analytics/posthog-provider";
import { siteConfig } from "@/lib/site-config";
import s from "./contact-quiz.module.css";
const cx = (names: string) =>
  names
    .split(" ")
    .map((n) => s[n] || n)
    .join(" ");
const titles = [
  "What can we help with?",
  "What kind of property?",
  "Where do you need service?",
  "How many backflow devices?",
  "When do you need us?",
  "How can we reach you?",
];
const clients = [
  ["In-N-Out Burger", "installation-yorba-linda-2.jpg", "in-n-out.png"],
  ["Costco", "replacement-costco-tustin-3.jpg", "costco.png"],
  ["Amazon", "rp-installation-seal-beach.jpg", "amazon.svg"],
  ["Hilton", "installation-hilton-oc-2.jpg", "hilton-white.png"],
];
const initialContact = {
  name: "",
  email: "",
  phone: "",
  method: "call",
  notes: "",
  unit: "",
  company: "",
  preferredDate: "",
};
export function ContactQuiz() {
  const ph = usePostHog(),
    analyticsReady = useAnalyticsReady();
  const [step, setStep] = useState(0),
    [address, setAddress] = useState<ServiceAddress>({ ...emptyAddress }),
    [service, setService] = useState(""),
    [property, setProperty] = useState(""),
    [count, setCount] = useState(""),
    [timing, setTiming] = useState(""),
    [contact, setContact] = useState(initialContact);
  const [files, setFiles] = useState<File[]>([]),
    [preparing, setPreparing] = useState(false),
    [uploadError, setUploadError] = useState("");
  const [status, setStatus] = useState<
      "idle" | "sending" | "success" | "error"
    >("idle"),
    [error, setError] = useState(""),
    [creditOpen, setCreditOpen] = useState(false);
  // True when the service question was answered before arriving (homepage
  // chips), so the quiz does not ask it a second time.
  const [serviceAnswered, setServiceAnswered] = useState(false);
  const [attachmentMissing, setAttachmentMissing] = useState(false);
  const [credit, setCredit] = useState<{ key: string; cents: number } | null>(
    null,
  );
  const heading = useRef<HTMLHeadingElement>(null),
    started = useRef(false),
    viewed = useRef(false),
    initialStepViewed = useRef(false),
    sending = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const capture = (
    event: string,
    properties: Record<string, string | number | boolean> = {},
  ) =>
    safeCapture(ph, event, {
      intake_variant: INTAKE_VARIANT,
      page_path: siteConfig.contactPath,
      question_order: "service_property_address",
      ...properties,
    });
  // Hydrate optional URL intent after mount; the server and first browser render stay identical.
  useEffect(() => {
    const intent = contactIntentFromSearch(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initialize URL intent without a hydration mismatch
    setService(intent.service);
    setServiceAnswered(intent.serviceAnswered);
    setProperty(intent.property);
    setStep(intent.serviceAnswered ? 1 : 0);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (!analyticsReady || viewed.current) return;
    viewed.current = true;
    safeCapture(ph, "contact_quiz_viewed", {
      intake_variant: INTAKE_VARIANT,
      page_path: siteConfig.contactPath,
      question_order: "service_property_address",
    });
    if (!initialStepViewed.current) {
      initialStepViewed.current = true;
      const carriedService = contactIntentFromSearch(
        window.location.search,
      ).serviceAnswered;
      safeCapture(ph, "contact_quiz_step_viewed", {
        intake_variant: INTAKE_VARIANT,
        page_path: siteConfig.contactPath,
        question_order: "service_property_address",
        step: carriedService ? 2 : 1,
        step_name: carriedService ? "property" : "service",
      });
    }
  }, [ph, analyticsReady]);
  const key = JSON.stringify({
    service,
    property,
    device_count: /^\d+$/.test(count) ? Number(count) : null,
  });
  // A boolean, not `step`: moving from timing to details must not cancel and
  // restart the request that was started early on purpose.
  const wantCredit = step >= 4;
  useEffect(() => {
    // Asked as soon as the device count is known (the timing step), not when
    // the details step opens: by then the card is already there, instead of
    // arriving late and pushing the form down under the visitor's cursor.
    if (!wantCredit || service !== "Testing" || !/^\d+$/.test(count)) return;
    const abort = new AbortController();
    void fetch("/api/contact/repair-credit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: key,
      signal: abort.signal,
    })
      .then(async (res) => {
        if (!res.ok) return;
        const d = await res.json();
        if (
          !abort.signal.aborted &&
          d.available === true &&
          Number.isInteger(d.repair_credit_cents) &&
          d.repair_credit_cents >= 0 &&
          d.repair_credit_cents <= 50000
        )
          setCredit({ key, cents: d.repair_credit_cents });
      })
      .catch(() => {
        /* An unavailable benefit never blocks contact. */
      });
    return () => abort.abort();
  }, [key, wantCredit, service, count]);
  const creditCents = credit?.key === key ? credit.cents : null;
  function start(entryAction = "address_interaction") {
    if (!started.current) {
      started.current = true;
      capture("contact_quiz_started", { entry_action: entryAction });
    }
  }
  function go(next: number) {
    if (sending.current) return;
    if (timer.current) clearTimeout(timer.current);
    setStep(next);
    setStatus("idle");
    setError("");
    capture("contact_quiz_step_viewed", {
      step: next + 1,
      step_name: [
        "service",
        "property",
        "address",
        "devices",
        "timing",
        "contact",
      ][next],
    });
    requestAnimationFrame(() =>
      heading.current?.focus({ preventScroll: true }),
    );
  }
  function chooseAddress(next: ServiceAddress) {
    setAddress(next);
    capture("contact_quiz_address_completed", { method: next.source });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(
      () => go(service === "Testing" ? 3 : 4),
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
        next.source === "manual"
        ? 0
        : 280,
    );
  }
  function changeAddress(next: ServiceAddress) {
    if (timer.current) clearTimeout(timer.current);
    setAddress(next);
  }
  function choose(value: string) {
    if (step === 0) {
      start("service_selection");
      setService(value);
      setServiceAnswered(false);
    }
    if (step === 1) {
      start("property_selection");
      setProperty(value);
    }
    if (step === 4) setTiming(value);
    capture("contact_quiz_option_selected", {
      step: ["serviceType", "propertyType", "address", "devices", "urgency"][
        step
      ],
      value,
    });
    go(step + 1);
  }
  async function addFiles(added: File[]) {
    if (preparing) return;
    setPreparing(true);
    setUploadError("");
    try {
      const result = await prepareUploads([...files, ...added]);
      setFiles(result.files);
      setUploadError(result.error || "");
      capture("contact_quiz_upload_prepared", {
        file_count: result.files.length,
        within_limit: !result.error,
      });
    } catch {
      setUploadError("We couldn’t prepare that attachment. Try another file.");
    } finally {
      setPreparing(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending.current || preparing || uploadError) return;
    const phone = contact.phone.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
    if (phone.length !== 10) {
      setError("Please enter a 10-digit phone number.");
      capture("contact_form_client_validation_failed", { field: "phone" });
      return;
    }
    sending.current = true;
    setStatus("sending");
    setError("");
    const [first, ...last] = contact.name.trim().split(/\s+/);
    const data = new FormData();
    const fields = {
      intake_variant: INTAKE_VARIANT,
      first_name: first || "",
      last_name: last.join(" "),
      email: contact.email,
      phone,
      company_name: contact.company,
      contact_preference: contact.method,
      address_street: address.street,
      address_city: address.city,
      address_state: address.state,
      address_postal_code: address.postalCode,
      address_unit: contact.unit,
      address_source: address.source,
      address_place_id: "",
      service_type: service,
      property_type: property,
      testing_count: service === "Testing" ? count : "",
      urgency: timing,
      preferred_date: contact.preferredDate,
      service_details: contact.notes,
      "Message-Field-4": contactIntentFromSearch(location.search).notes,
      page_path: siteConfig.contactPath,
      source_url: location.origin + location.pathname,
      lead_source: "Website Contact Form",
    };
    Object.entries(fields).forEach(([k, v]) => data.set(k, v));
    files.forEach((file) => data.append("contact_uploads", file));
    const headers: Record<string, string> = {};
    try {
      const id = ph?.get_distinct_id(),
        session = ph?.get_session_id?.();
      if (id) headers["X-PostHog-Distinct-Id"] = id;
      if (session) headers["X-PostHog-Session-Id"] = session;
    } catch {
      /* Submission does not depend on analytics. */
    }
    capture("form_submitted", {
      form_action: "/api/contact",
      device_count_known: /^\d+$/.test(count),
    });
    try {
      const result = await fetch("/api/contact", {
        method: "POST",
        body: data,
        headers,
      });
      const receipt = result.clone();
      const failure = await readContactResponse(result);
      if (failure) {
        setError(failure.message);
        setStatus("error");
        capture("form_submit_failed", { failure_reason: failure.reason });
        return;
      }
      const accepted = await receipt.json().catch(() => ({}));
      setAttachmentMissing(accepted.attachmentStatus === "not_delivered");
      setStatus("success");
      capture("form_submit_succeeded", { form_action: "/api/contact" });
      requestAnimationFrame(() =>
        heading.current?.focus({ preventScroll: true }),
      );
    } catch {
      const failure = describeNetworkFailure();
      setError(failure.message);
      setStatus("error");
      capture("form_submit_failed", { failure_reason: failure.reason });
    } finally {
      sending.current = false;
    }
  }
  const options =
      step === 0
        ? serviceOptions
        : step === 1
          ? propertyOptions
          : timingOptions,
    selected = step === 0 ? service : step === 1 ? property : timing;
  const isEntryStep = step === 0 || (step === 1 && serviceAnswered);
  return (
    <div
      className={cx("page")}
      data-intake-variant={INTAKE_VARIANT}
      data-quiz-step={step + 1}
    >
      <header>
        <Link
          className={cx("brand")}
          href="/"
          aria-label="Backflow Test Pros home"
        >
          <Image
            src="/assets/brand/nav-logo.png"
            alt="Backflow Test Pros"
            width={270}
            height={43}
            priority
          />
        </Link>
        <a href={siteConfig.phone.href} data-phone-placement="contact-header">
          <PhoneIcon />
          <span>Call</span>
        </a>
      </header>
      <main>
        <section
          className={cx(`journey ${isEntryStep ? "" : "in-progress"}`)}
          aria-label="Service request"
        >
          <div className={cx("section-top")}>
            {step > 0 && !isEntryStep && status !== "success" && (
              <>
                <button
                  className={cx("back")}
                  aria-label="Go back"
                  disabled={status === "sending"}
                  onClick={() =>
                    go(
                      step === 4 && service !== "Testing" ? 2 : step - 1,
                    )
                  }
                >
                  <ArrowLeftIcon />
                  Back
                </button>
                {address.formatted && step !== 2 && (
                  <button
                    className={cx("address-chip ph-no-capture")}
                    disabled={status === "sending"}
                    onClick={() => go(2)}
                  >
                    <MapPinIcon />
                    <span>{address.formatted}</span>
                    <span className={cx("change")}>Change</span>
                  </button>
                )}
              </>
            )}
          </div>
          {status === "success" ? (
            <div className={cx("completed stage")}>
              <span className={cx("complete-icon")}>
                <CheckIcon />
              </span>
              <h1 ref={heading} tabIndex={-1}>
                You’re in good hands.
              </h1>
              <p>
                We’ve received your request. Our team will review it and get in
                touch.
              </p>
              {attachmentMissing && (
                <p>
                  Your request arrived, but the attachment didn’t. Please email
                  it to{" "}
                  <a href={siteConfig.email.href}>{siteConfig.email.address}</a>
                  .
                </p>
              )}
              <p className="ph-no-capture">{address.formatted}</p>
              <a
                href={siteConfig.phone.href}
                data-phone-placement="contact-success"
              >
                Need us sooner? Call {siteConfig.phone.display}
              </a>
            </div>
          ) : (
            <>
              <div className={cx("intro")}>
                <h1 ref={heading} tabIndex={-1}>
                  {titles[step]}
                </h1>
                {isEntryStep ? (
                  <p className={cx("benefit")}>
                    See how much{" "}
                    <button
                      aria-expanded={creditOpen}
                      onClick={() => {
                        setCreditOpen((v) => !v);
                        capture("contact_credit_details_opened");
                      }}
                    >
                      repair credit
                    </button>{" "}
                    you qualify for.
                  </p>
                ) : (
                  <div className={cx("progress")} aria-label="Request progress">
                    <span style={{ width: `${((step + 1) / 6) * 100}%` }} />
                  </div>
                )}
                {step === 1 && serviceAnswered && (
                  <p className={cx("carried")}>
                    {service}
                    <button
                      onClick={() => {
                        setServiceAnswered(false);
                        capture("contact_quiz_carried_service_changed");
                        go(0);
                      }}
                    >
                      Change
                    </button>
                  </p>
                )}
                {isEntryStep && creditOpen && (
                  <p className={cx("credit-detail")}>
                    Your paid test can become credit toward repairs if it fails,
                    up to $500.
                  </p>
                )}
              </div>
              <div className={cx("form-area")}>
                <div className={cx("stage")} key={step}>
                  {step === 2 && (
                    <AddressSearch
                      value={address}
                      onChange={changeAddress}
                      onSelect={chooseAddress}
                      onStart={start}
                      focusOnArrival={serviceAnswered}
                      onEvent={capture}
                    />
                  )}
                  {[0, 1, 4].includes(step) && (
                    <div className={cx("options")}>
                      {options.map(([value, label]) => (
                        <button
                          key={value}
                          aria-pressed={selected === value}
                          className={
                            selected === value ? s.selected : undefined
                          }
                          onClick={() => choose(value)}
                        >
                          {label}
                          <ChevronRightIcon />
                        </button>
                      ))}
                    </div>
                  )}
                  {step === 3 && (
                    <DeviceCount
                      value={count}
                      onContinue={(n) => {
                        setCount(n);
                        capture("contact_quiz_device_count_completed", {
                          known: /^\d+$/.test(n),
                          ...(/^\d+$/.test(n) ? { count: Number(n) } : {}),
                        });
                        go(4);
                      }}
                    />
                  )}
                  {step === 5 && (
                    <form className={cx("contact-form")} onSubmit={submit}>
                      {creditCents !== null && (
                        <div className={cx("credit-reveal")}>
                          <div className={cx("credit-clip")}>
                            <div className={cx("credit-summary")}>
                              <span className={cx("credit-eyebrow")}>
                                Your test includes
                              </span>
                              <div className={cx("credit-value")}>
                                <strong>${creditCents / 100}</strong>
                                <span>repair credit</span>
                              </div>
                              <p>Toward repairs if your test fails.</p>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className={cx("contact-grid")}>
                        <label>
                          Name
                          <input
                            className="ph-no-capture"
                            required
                            autoComplete="name"
                            maxLength={150}
                            value={contact.name}
                            onChange={(e) =>
                              setContact({ ...contact, name: e.target.value })
                            }
                          />
                        </label>
                        <label>
                          Email
                          <input
                            className="ph-no-capture"
                            required
                            type="email"
                            autoComplete="email"
                            maxLength={200}
                            value={contact.email}
                            onChange={(e) =>
                              setContact({ ...contact, email: e.target.value })
                            }
                          />
                        </label>
                      </div>
                      <label>
                        Phone
                        <input
                          className="ph-no-capture"
                          required
                          type="tel"
                          autoComplete="tel"
                          maxLength={25}
                          value={contact.phone}
                          onChange={(e) =>
                            setContact({ ...contact, phone: e.target.value })
                          }
                        />
                      </label>
                      <div
                        className={cx("contact-methods")}
                        aria-label="Preferred contact method"
                      >
                        {[
                          ["call", "Call me"],
                          ["email", "Email me"],
                        ].map(([value, label]) => (
                          <button
                            type="button"
                            aria-pressed={contact.method === value}
                            key={value}
                            onClick={() => {
                              setContact({ ...contact, method: value });
                              capture("contact_preference_selected", {
                                preference: value,
                              });
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <details>
                        <summary>Anything else we should know?</summary>
                        <div className={cx("more-fields")}>
                          <label>
                            Details
                            <textarea
                              className="ph-no-capture"
                              maxLength={4000}
                              placeholder="Timing, access, or a question…"
                              value={contact.notes}
                              onChange={(e) =>
                                setContact({
                                  ...contact,
                                  notes: e.target.value,
                                })
                              }
                            />
                          </label>
                          <label>
                            Suite / unit
                            <input
                              className="ph-no-capture"
                              autoComplete="address-line2"
                              maxLength={100}
                              value={contact.unit}
                              onChange={(e) =>
                                setContact({ ...contact, unit: e.target.value })
                              }
                            />
                          </label>
                          <label>
                            Company
                            <input
                              className="ph-no-capture"
                              autoComplete="organization"
                              maxLength={150}
                              value={contact.company}
                              onChange={(e) =>
                                setContact({
                                  ...contact,
                                  company: e.target.value,
                                })
                              }
                            />
                          </label>
                          <label>
                            Preferred date
                            <input
                              type="date"
                              value={contact.preferredDate}
                              onChange={(e) =>
                                setContact({
                                  ...contact,
                                  preferredDate: e.target.value,
                                })
                              }
                            />
                          </label>
                        </div>
                      </details>
                      <div className={cx("upload-row")}>
                        <label>
                          <PaperClipIcon />
                          <span>
                            {preparing
                              ? "Preparing attachments…"
                              : "Add your notice or a photo"}
                          </span>
                          <span className={cx("upload-optional")}>
                            Optional
                          </span>
                          <input
                            className={cx("sr-only")}
                            type="file"
                            accept="image/*,application/pdf"
                            multiple
                            aria-describedby="notice-upload-help"
                            disabled={preparing || status === "sending"}
                            onChange={(e) => {
                              void addFiles(Array.from(e.target.files || []));
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <p id="notice-upload-help">
                          No notice handy? You can still send your request.
                        </p>
                      </div>
                      {files.length > 0 && (
                        <ul className={cx("file-list ph-no-capture")}>
                          {files.map((file, i) => (
                            <li key={`${file.name}-${i}`}>
                              <span>
                                {file.name} · {formatFileSize(file.size)}
                              </span>
                              <button
                                type="button"
                                aria-label={`Remove ${file.name}`}
                                disabled={status === "sending" || preparing}
                                onClick={() => {
                                  setFiles((f) => f.filter((_, j) => i !== j));
                                  setUploadError("");
                                }}
                              >
                                <XMarkIcon />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {(error || uploadError) && (
                        <p role="alert" className={cx("error")}>
                          {error || uploadError}{" "}
                          <a
                            href={siteConfig.phone.href}
                            data-phone-placement="contact-error"
                          >
                            Call us
                          </a>
                        </p>
                      )}
                      <button
                        type="submit"
                        className={cx("primary")}
                        disabled={
                          status === "sending" ||
                          preparing ||
                          Boolean(uploadError)
                        }
                      >
                        {status === "sending"
                          ? "Sending your request…"
                          : "Send my request"}
                        <ArrowRightIcon />
                      </button>
                      <p className={cx("form-note")}>
                        We’ll contact you about this request.{" "}
                        <Link href="/privacy-policy">Privacy policy</Link>
                      </p>
                    </form>
                  )}
                </div>
                <ServiceMap address={address} onEvent={capture} />
              </div>
            </>
          )}
        </section>
        <section className={cx("trust")} aria-labelledby="client-heading">
          <h2 id="client-heading">From local shops to national names.</h2>
          <div className={cx("photos")}>
            {clients.map(([name, photo, logo]) => (
              <figure key={name}>
                <Image
                  className={cx("photo")}
                  src={`/assets/photos/${photo}`}
                  alt="Backflow testing and installation"
                  fill
                  sizes="(max-width:700px) 45vw,25vw"
                />
                <Image
                  className={cx("client-logo")}
                  src={`/assets/logos/clients/${logo}`}
                  alt={name}
                  width={150}
                  height={70}
                />
              </figure>
            ))}
          </div>
        </section>
      </main>
      <footer>
        <span>© {new Date().getFullYear()} Backflow Test Pros</span>
        <a href={siteConfig.phone.href} data-phone-placement="contact-footer">
          {siteConfig.phone.display}
        </a>
      </footer>
    </div>
  );
}
