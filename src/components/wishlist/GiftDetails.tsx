import Image from "next/image";
import { getTranslations } from "next-intl/server";
export async function GiftDetails({
  gift,
  token,
}: {
  gift: {
    title: string;
    image: string | null;
    size: string | null;
    color: string | null;
    model: string | null;
  };
  token?: string;
}) {
  const t = await getTranslations("wishlist");
  return (
    <>
      {gift.image && /^[a-f0-9-]{36}\.webp$/.test(gift.image) && (
        <Image
          unoptimized
          src={`/api/gift-images/${gift.image}${token ? `?token=${encodeURIComponent(token)}` : ""}`}
          alt={gift.title}
          width={800}
          height={600}
          className="gift-photo"
          referrerPolicy="no-referrer"
        />
      )}
      <dl className="gift-variants">
        {(["size", "color", "model"] as const).map(
          (key) =>
            gift[key] && (
              <div key={key}>
                <dt>{t(key)}</dt>
                <dd>{gift[key]}</dd>
              </div>
            ),
        )}
      </dl>
    </>
  );
}
