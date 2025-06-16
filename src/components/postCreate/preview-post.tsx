import { formatDistanceToNow } from "date-fns";
import DOMPurify from "dompurify";
import {
  FaFacebook as Facebook,
  FaInstagram as Instagram,
  FaLinkedin as Linkedin,
} from "react-icons/fa";

// Preview Components
export const FacebookPostPreview = ({
  content,
  media,
  pageName = "Facebook User",
}: {
  content: string;
  media?: string[];
  pageName?: string;
}) => {
  const timeAgo = formatDistanceToNow(new Date(), { addSuffix: true });
  return (
    <div className="max-w-[500px] rounded-lg bg-white p-4 shadow-md">
      <div className="mb-2 flex items-center gap-3">
        <Facebook className="h-8 w-8 text-blue-600" />
        <div>
          <div className="font-semibold text-gray-800">{pageName}</div>
          <div className="text-xs text-gray-500">{timeAgo}</div>
        </div>
      </div>
      <div
        className="mb-2 whitespace-pre-wrap break-words text-gray-800"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
      />
      {media && media.length > 0 && (
        <div className="mt-2 overflow-hidden rounded-md">
          {media.length === 1 ? (
            media[0].startsWith("data:video") ||
            media[0].endsWith(".mp4") ||
            media[0].endsWith(".mov") ? (
              <video controls className="max-h-[500px] w-full object-contain">
                <source src={media[0]} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={media[0]}
                alt="Post Media"
                className="max-h-[500px] w-full object-contain"
              />
            )
          ) : (
            <div
              className={`grid gap-0.5 ${media.length === 2 ? "grid-cols-2" : media.length === 3 ? "grid-cols-2" : "grid-cols-2"}`}
            >
              {media.slice(0, 4).map((item, index) => (
                <div key={index} className="relative aspect-square">
                  {item.startsWith("data:video") ||
                  item.endsWith(".mp4") ||
                  item.endsWith(".mov") ? (
                    <video controls className="h-full w-full object-cover">
                      <source src={item} type="video/mp4" />
                    </video>
                  ) : (
                    <img
                      src={item}
                      alt={`Media ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  )}
                  {index === 3 && media.length > 4 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-2xl font-bold text-white">
                      +{media.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="mt-2 flex gap-4 text-sm text-gray-600">
        <span>Like</span>
        <span>Comment</span>
        <span>Share</span>
      </div>
    </div>
  );
};

export const InstagramPostPreview = ({
  content,
  media,
  pageName = "Instagram User",
}: {
  content: string;
  media?: string[];
  pageName?: string;
}) => {
  const timeAgo = formatDistanceToNow(new Date(), { addSuffix: true });
  return (
    <div className="max-w-[470px] rounded-lg bg-white shadow-md">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Instagram className="h-8 w-8 text-pink-500" />
          <div className="font-semibold text-gray-800">{pageName}</div>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-gray-600"
        >
          <circle cx="12" cy="12" r="1.5"></circle>
          <circle cx="6" cy="12" r="1.5"></circle>
          <circle cx="18" cy="12" r="1.5"></circle>
        </svg>
      </div>
      <div className="rounded-md border border-gray-300">
        {media && media.length > 0 ? (
          <div className="relative">
            {media.length === 1 ? (
              media[0].startsWith("data:video") ||
              media[0].endsWith(".mp4") ||
              media[0].endsWith(".mov") ? (
                <video controls className="aspect-square w-full object-cover">
                  <source src={media[0]} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={media[0]}
                  alt="Post Media"
                  className="aspect-square w-full object-cover"
                />
              )
            ) : (
              <div className="relative aspect-square overflow-hidden">
                {media[0].startsWith("data:video") ||
                media[0].endsWith(".mp4") ||
                media[0].endsWith(".mov") ? (
                  <video controls className="h-full w-full object-cover">
                    <source src={media[0]} type="video/mp4" />
                  </video>
                ) : (
                  <img
                    src={media[0]}
                    alt="Post Media"
                    className="h-full w-full object-cover"
                  />
                )}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1">
                  {media.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 w-2 rounded-full ${index === 0 ? "bg-blue-500" : "bg-gray-300"}`}
                    ></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex aspect-square items-center justify-center rounded-t-md bg-gray-200 text-gray-400">
            Image/Video Placeholder
          </div>
        )}
        <div className="p-3">
          <div className="mb-1 flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            <span className="font-semibold text-gray-800">Instagram User</span>
            <span className="ml-1 text-xs text-gray-500">{timeAgo}</span>
          </div>
          <div
            className="whitespace-pre-wrap break-words text-gray-800"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
          />
          <div className="mt-2 text-sm text-gray-600">
            <span>Like</span>
            <span>Comment</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LinkedinPostPreview = ({
  content,
  media,
  pageName = "LinkedIn User",
}: {
  content: string;
  media?: string[];
  pageName?: string;
}) => {
  const timeAgo = formatDistanceToNow(new Date(), { addSuffix: true });
  return (
    <div className="max-w-[550px] rounded-lg bg-white p-4 shadow-md">
      <div className="mb-2 flex items-center gap-3">
        <Linkedin className="h-8 w-8 text-blue-700" />
        <div>
          <div className="font-semibold text-gray-800">{pageName}</div>
          <div className="text-xs text-gray-500">{timeAgo}</div>
        </div>
      </div>
      <div
        className="mb-2 whitespace-pre-wrap break-words text-gray-800"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
      />
      {media && media.length > 0 && (
        <div className="mt-2 overflow-hidden rounded-md border border-gray-200">
          {media.length === 1 ? (
            media[0].startsWith("data:video") ||
            media[0].endsWith(".mp4") ||
            media[0].endsWith(".mov") ? (
              <video controls className="max-h-[500px] w-full object-contain">
                <source src={media[0]} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={media[0]}
                alt="Post Media"
                className="max-h-[500px] w-full object-contain"
              />
            )
          ) : (
            <div
              className={`grid gap-0.5 ${media.length === 2 ? "grid-cols-2" : "grid-cols-2"}`}
            >
              {media.slice(0, 4).map((item, index) => (
                <div key={index} className="relative aspect-square">
                  {item.startsWith("data:video") ||
                  item.endsWith(".mp4") ||
                  item.endsWith(".mov") ? (
                    <video controls className="h-full w-full object-cover">
                      <source src={item} type="video/mp4" />
                    </video>
                  ) : (
                    <img
                      src={item}
                      alt={`Media ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  )}
                  {index === 3 && media.length > 4 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-2xl font-bold text-white">
                      +{media.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="mt-2 flex gap-4 text-sm text-gray-600">
        <span>Like</span>
        <span>Comment</span>
        <span>Share</span>
      </div>
    </div>
  );
};
