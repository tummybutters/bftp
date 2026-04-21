export function DirectoryColumns({
  groups,
  variant = "stack",
}: {
  groups: Array<{
    heading: string;
    items: string[];
  }>;
  variant?: "stack" | "split";
}) {
  return (
    <div
      className={
        variant === "split"
          ? "bftp-directory-stack bftp-directory-stack--split"
          : "bftp-directory-stack"
      }
    >
      {groups.map((group) => (
        <section key={group.heading} className="bftp-directory-stack__group">
          <h3 className="bftp-directory-stack__title">{group.heading}</h3>
          <ul className="bftp-directory-stack__list">
            {group.items.map((item) => (
              <li key={item} className="bftp-directory-stack__item">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
