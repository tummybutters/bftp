"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePostHog } from "posthog-js/react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ChevronRightIcon,
  PaperClipIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { PhoneIcon } from "@heroicons/react/24/solid";
import { AddressSearch } from "./address-search";
import { ServiceMap } from "./service-map";
import {
  emptyAddress,
  INTAKE_VARIANT,
  propertyOptions,
  serviceOptions,
  timingOptions,
  titles,
  type ServiceAddress,
} from "@/lib/contact-intake";
import { prepareUploads, formatFileSize } from "@/lib/contact-uploads";
import {
  describeNetworkFailure,
  readContactResponse,
} from "@/lib/contact-response";
import { siteConfig } from "@/lib/site-config";
import s from "./contact-quiz.module.css";

const clients = [
  {
    name: "In-N-Out Burger",
    logo: "in-n-out.png",
    photo: "installation-yorba-linda-2.jpg",
    position: "center 62%",
  },
  {
    name: "Costco",
    logo: "costco.png",
    photo: "replacement-costco-tustin-3.jpg",
    position: "center",
  },
  {
    name: "Amazon",
    logo: "amazon.svg",
    photo: "rp-installation-seal-beach.jpg",
    position: "center",
  },
  {
    name: "Hilton",
    logo: "hilton-white.png",
    photo: "installation-hilton-oc-2.jpg",
    position: "center",
  },
];
const initialContact = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  company_name: "",
  address_unit: "",
  testing_count: "Not Sure",
  service_details: "",
  size_make_model: "",
  preferred_date: "",
};

export function ContactQuiz() {
  const posthog = usePostHog();
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState<ServiceAddress>({ ...emptyAddress });
  const [service, setService] = useState("");
  const [property, setProperty] = useState("");
  const [timing, setTiming] = useState("");
  const [contact, setContact] = useState(initialContact);
  const [files, setFiles] = useState<File[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [advancing, setAdvancing] = useState(false);
  const started = useRef(false);
  const submitting = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const gallery = useRef<HTMLDivElement>(null);
  const viewed = useRef(false);
  const capture = (
    event: string,
    properties: Record<string, string | number | boolean> = {},
  ) => {
    posthog?.capture(event, {
      intake_variant: INTAKE_VARIANT,
      page_path: siteConfig.contactPath,
      ...properties,
    });
  };
  useEffect(() => {
    if (!viewed.current) {
      viewed.current = true;
      posthog?.capture("contact_quiz_viewed", {
        intake_variant: INTAKE_VARIANT,
        page_path: siteConfig.contactPath,
      });
    }
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, [posthog]);
  const start = () => {
    if (!started.current) {
      started.current = true;
      capture("contact_quiz_started", { entry_action: "address_interaction" });
    }
  };
  const go = (index: number) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setAdvancing(false);
    setStep(index);
    setStatus("idle");
    setError("");
    capture("contact_quiz_step_viewed", { step: index + 1 });
    // Keep keyboard/screen-reader focus with the question without jumping a desktop viewport.
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      if (
        heading.current &&
        (heading.current.closest("section")?.getBoundingClientRect().top ?? 0) <
          0
      )
        window.scrollTo({ top: 0, behavior: "instant" });
    });
  };
  const chooseAddress = (value: ServiceAddress) => {
    if (advancing) return;
    setAddress(value);
    setAdvancing(true);
    capture("contact_quiz_address_completed", { method: value.source });
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    advanceTimer.current = setTimeout(
      () => go(1),
      reduced || value.source === "manual" ? 0 : 550,
    );
  };
  const select = (value: string) => {
    if (advancing) return;
    if (step === 1) setService(value);
    if (step === 2) setProperty(value);
    if (step === 3) setTiming(value);
    capture("contact_quiz_option_selected", {
      step: ["address", "serviceType", "propertyType", "urgency"][step],
      value,
    });
    setAdvancing(true);
    advanceTimer.current = setTimeout(
      () => go(step + 1),
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 160,
    );
  };
  const editContact = (key: keyof typeof contact, value: string) =>
    setContact((current) => ({ ...current, [key]: value }));
  const addFiles = async (added: File[]) => {
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
    } finally {
      setPreparing(false);
    }
  };
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting.current || preparing || uploadError) return;
    const phone = contact.phone.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
    if (phone.length !== 10) {
      setError("Please enter a 10-digit phone number.");
      setStatus("error");
      return;
    }
    submitting.current = true;
    setStatus("submitting");
    setError("");
    const data = new FormData();
    const fields = {
      ...contact,
      phone,
      intake_variant: INTAKE_VARIANT,
      service_type: service,
      property_type: property,
      urgency: timing,
      page_path: siteConfig.contactPath,
      source_url: location.origin + location.pathname,
      lead_source: "Website Contact Form",
      service_address: address.formatted,
      address_street: address.street,
      address_city: address.city,
      city: address.city,
      address_state: address.state,
      address_postal_code: address.postalCode,
      county: address.county,
      address_source: address.source,
      address_place_id: address.placeId,
      testing_count: service === "Testing" ? contact.testing_count : "",
      size_make_model:
        service === "Repair / Replacement" ? contact.size_make_model : "",
    };
    Object.entries(fields).forEach(([key, value]) => data.set(key, value));
    files.forEach((file) => data.append("contact_uploads", file));
    const headers: Record<string, string> = {};
    const id = posthog?.get_distinct_id();
    const session = posthog?.get_session_id?.();
    if (id) headers["X-PostHog-Distinct-Id"] = id;
    if (session) headers["X-PostHog-Session-Id"] = session;
    capture("form_submitted", { form_action: "/api/contact" });
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body: data,
        headers,
      });
      const failure = await readContactResponse(response);
      if (failure) {
        setError(failure.message);
        setStatus("error");
        capture("form_submit_failed", { failure_reason: failure.reason });
        return;
      }
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
      submitting.current = false;
    }
  };
  const options =
    step === 1 ? serviceOptions : step === 2 ? propertyOptions : timingOptions;
  const selected = step === 1 ? service : step === 2 ? property : timing;

  return (
    <div
      className={s.page}
      data-intake-variant={INTAKE_VARIANT}
      data-quiz-step={step + 1}
    >
      <header className={s.header}>
        <div className={s.headerInner}>
          <Link href="/" aria-label="Backflow Test Pros home">
            <Image
              src="/assets/brand/nav-logo.png"
              alt="Backflow Test Pros"
              width={270}
              height={43}
              priority
            />
          </Link>
          <a
            href={siteConfig.phone.href}
            className={s.call}
            data-phone-placement="contact-header"
          >
            <PhoneIcon aria-hidden="true" />
            Call
          </a>
        </div>
      </header>
      <main className={s.main}>
        <div className={s.layout}>
          <section className={s.quiz} aria-label="Service request">
            {status === "success" ? (
              <div className={s.success}>
                <CheckIcon className={s.successIcon} aria-hidden="true" />
                <h1 ref={heading} tabIndex={-1}>
                  You’re in good hands.
                </h1>
                <p>
                  We’ve received your request. Our team will review the details
                  and reach out to help with the next step.
                </p>
                <p className={`${s.addressSummary} ph-no-capture`}>
                  {address.formatted}
                </p>
                <a
                  href={siteConfig.phone.href}
                  className={s.textButton}
                  data-phone-placement="contact-success"
                >
                  Need us sooner? Call {siteConfig.phone.display}
                </a>
              </div>
            ) : (
              <>
                <div className={s.progressRow}>
                  {step > 0 && (
                    <button
                      type="button"
                      aria-label="Go back"
                      className={s.back}
                      disabled={status === "submitting"}
                      onClick={() => go(step - 1)}
                    >
                      <ArrowLeftIcon />
                    </button>
                  )}
                  <div
                    className={s.progress}
                    role="progressbar"
                    aria-label="Request progress"
                    aria-valuemin={1}
                    aria-valuemax={5}
                    aria-valuenow={step + 1}
                  >
                    {titles.map((title, index) => (
                      <span
                        key={title}
                        className={index <= step ? s.filled : ""}
                      />
                    ))}
                  </div>
                </div>
                <div key={step} className={s.step}>
                  <h1 ref={heading} tabIndex={-1}>
                    {titles[step]}
                  </h1>
                  {step === 0 ? (
                    <>
                      <AddressSearch
                        value={address}
                        onChange={(value) => {
                          if (advanceTimer.current)
                            clearTimeout(advanceTimer.current);
                          setAdvancing(false);
                          setAddress(value);
                        }}
                        onSelect={chooseAddress}
                        onStart={start}
                      />
                      <ul className={s.benefits}>
                        <li>
                          <CheckIcon aria-hidden="true" />
                          Same-day report filing
                        </li>
                        <li>
                          <CheckIcon aria-hidden="true" />
                          <span>Up to $500 in repair credit, on us.</span>
                        </li>
                      </ul>
                    </>
                  ) : step < 4 ? (
                    <>
                      <div className={s.options}>
                        {options.map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={selected === value}
                            disabled={advancing}
                            onClick={() => select(value)}
                            className={selected === value ? s.selected : ""}
                          >
                            <span>{label}</span>
                            <ChevronRightIcon aria-hidden="true" />
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className={`${s.addressSummary} ph-no-capture`}
                        onClick={() => go(0)}
                      >
                        {address.formatted}
                      </button>
                    </>
                  ) : (
                    <form
                      onSubmit={submit}
                      className={`${s.contactForm} ph-no-capture`}
                    >
                      <div className={s.fieldPair}>
                        <label>
                          First name
                          <input
                            name="first_name"
                            autoComplete="given-name"
                            required
                            maxLength={80}
                            value={contact.first_name}
                            onChange={(e) =>
                              editContact("first_name", e.target.value)
                            }
                          />
                        </label>
                        <label>
                          Last name
                          <input
                            name="last_name"
                            autoComplete="family-name"
                            required
                            maxLength={80}
                            value={contact.last_name}
                            onChange={(e) =>
                              editContact("last_name", e.target.value)
                            }
                          />
                        </label>
                      </div>
                      <label>
                        Email
                        <input
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          maxLength={254}
                          value={contact.email}
                          onChange={(e) => editContact("email", e.target.value)}
                        />
                      </label>
                      <label>
                        Phone
                        <input
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          required
                          maxLength={25}
                          value={contact.phone}
                          onChange={(e) => editContact("phone", e.target.value)}
                        />
                      </label>
                      <details className={s.details}>
                        <summary>
                          Anything else? <span>Optional</span>
                        </summary>
                        <div className={s.extraFields}>
                          {property !== "Residential" && (
                            <label>
                              Company
                              <input
                                autoComplete="organization"
                                value={contact.company_name}
                                maxLength={150}
                                onChange={(e) =>
                                  editContact("company_name", e.target.value)
                                }
                              />
                            </label>
                          )}
                          <label>
                            Suite, unit or location notes
                            <input
                              autoComplete="address-line2"
                              maxLength={200}
                              value={contact.address_unit}
                              onChange={(e) =>
                                editContact("address_unit", e.target.value)
                              }
                            />
                          </label>
                          {service === "Testing" && (
                            <label>
                              How many backflow devices?
                              <select
                                value={contact.testing_count}
                                onChange={(e) =>
                                  editContact("testing_count", e.target.value)
                                }
                              >
                                {["Not Sure", "1", "2", "3", "4", "5+"].map(
                                  (v) => (
                                    <option key={v}>{v}</option>
                                  ),
                                )}
                              </select>
                            </label>
                          )}
                          {service === "Repair / Replacement" && (
                            <label>
                              Size, make or model, if you know it
                              <input
                                value={contact.size_make_model}
                                maxLength={300}
                                onChange={(e) =>
                                  editContact("size_make_model", e.target.value)
                                }
                              />
                            </label>
                          )}
                          <label>
                            Preferred date
                            <input
                              type="date"
                              value={contact.preferred_date}
                              onInput={(e) =>
                                editContact(
                                  "preferred_date",
                                  e.currentTarget.value,
                                )
                              }
                              onChange={(e) =>
                                editContact("preferred_date", e.target.value)
                              }
                            />
                          </label>
                          <label>
                            Anything we should know?
                            <textarea
                              rows={3}
                              maxLength={2500}
                              value={contact.service_details}
                              onChange={(e) =>
                                editContact("service_details", e.target.value)
                              }
                            />
                          </label>
                          <label className={s.upload}>
                            <PaperClipIcon aria-hidden="true" />
                            Add photos or a notice
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              multiple
                              disabled={preparing}
                              onChange={(e) => {
                                const added = Array.from(e.target.files || []);
                                e.target.value = "";
                                void addFiles(added);
                              }}
                            />
                          </label>
                          {files.map((file, index) => (
                            <div
                              className={s.file}
                              key={`${file.name}-${index}`}
                            >
                              <span>
                                {file.name}{" "}
                                <small>{formatFileSize(file.size)}</small>
                              </span>
                              <button
                                type="button"
                                aria-label={`Remove ${file.name}`}
                                disabled={preparing}
                                onClick={() => void addFilesAfterRemoval(index)}
                              >
                                <XMarkIcon />
                              </button>
                            </div>
                          ))}
                          {preparing && (
                            <p role="status">Preparing your photos…</p>
                          )}
                        </div>
                      </details>
                      {(error || uploadError) && (
                        <div className={s.error} role="alert">
                          <p>{error || uploadError}</p>
                          <a
                            href={siteConfig.phone.href}
                            data-phone-placement="contact-error"
                          >
                            Call us for help
                          </a>
                        </div>
                      )}
                      <button
                        type="submit"
                        className={s.primary}
                        disabled={
                          status === "submitting" ||
                          preparing ||
                          Boolean(uploadError)
                        }
                      >
                        {status === "submitting"
                          ? "Sending your request…"
                          : "Send my request"}
                        {status !== "submitting" && (
                          <ArrowRightIcon aria-hidden="true" />
                        )}
                      </button>
                      <p className={s.consent}>
                        We’ll contact you about this request.{" "}
                        <Link href="/privacy-policy">Privacy policy</Link>
                      </p>
                      <button
                        type="button"
                        className={s.addressSummary}
                        disabled={status === "submitting"}
                        onClick={() => go(0)}
                      >
                        {address.formatted}
                      </button>
                    </form>
                  )}
                </div>
              </>
            )}
          </section>
          <ServiceMap address={address} />
        </div>
        <section className={s.proof} aria-labelledby="client-heading">
          <div className={s.proofHeading}>
            <h2 id="client-heading">From local shops to national names.</h2>
            <div className={s.galleryControls}>
              <button
                type="button"
                aria-label="Previous customer photos"
                onClick={() =>
                  gallery.current?.scrollBy({
                    left: -340,
                    behavior: window.matchMedia(
                      "(prefers-reduced-motion: reduce)",
                    ).matches
                      ? "instant"
                      : "smooth",
                  })
                }
              >
                <ArrowLeftIcon />
              </button>
              <button
                type="button"
                aria-label="Next customer photos"
                onClick={() =>
                  gallery.current?.scrollBy({
                    left: 340,
                    behavior: window.matchMedia(
                      "(prefers-reduced-motion: reduce)",
                    ).matches
                      ? "instant"
                      : "smooth",
                  })
                }
              >
                <ArrowRightIcon />
              </button>
            </div>
          </div>
          <div ref={gallery} className={s.gallery}>
            {clients.map((client, index) => (
              <div key={client.name} className={s.client}>
                <Image
                  src={`/assets/photos/${client.photo}`}
                  alt=""
                  fill
                  loading={index === 0 ? "eager" : "lazy"}
                  sizes="(max-width: 700px) 75vw, 25vw"
                  style={{
                    objectFit: "cover",
                    objectPosition: client.position,
                  }}
                />
                <Image
                  className={s.clientLogo}
                  src={`/assets/logos/clients/${client.logo}`}
                  alt={client.name}
                  width={150}
                  height={70}
                />
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className={s.footer}>
        <span>© {new Date().getFullYear()} Backflow Test Pros</span>
        <a href={siteConfig.phone.href} data-phone-placement="contact-footer">
          {siteConfig.phone.display}
        </a>
      </footer>
    </div>
  );
  async function addFilesAfterRemoval(index: number) {
    setPreparing(true);
    try {
      const result = await prepareUploads(files.filter((_, i) => i !== index));
      setFiles(result.files);
      setUploadError(result.error || "");
    } finally {
      setPreparing(false);
    }
  }
}
