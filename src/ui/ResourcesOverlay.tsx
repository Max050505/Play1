import { resourcesStore } from "../store/resourceStore";
import { RESOURCE_ICONS } from "../utils/constants";
import { useResponsiveStore } from "../store/useResponsiveStore";


const ResourcesOverlay: React.FC = () => {
  const state = resourcesStore();
  const { isMobile } = useResponsiveStore();
  const activeResources = [
    { id: 'coin', val: state.coin, icon: RESOURCE_ICONS.coin },
    { id: 'police', val: state.police, icon: RESOURCE_ICONS.police },
    { id: 'plane', val: state.plane, icon: RESOURCE_ICONS.plane },
    { id: 'hospital', val: state.hospital, icon: RESOURCE_ICONS.hospital },
  ];

  const top = isMobile ? "top-3" : "top-5";
  const right = isMobile ? "right-3" : "right-5";
  const fontSize = isMobile ? "text-[20px]" : "text-[25px]";
  const iconSize = isMobile ? "w-6 h-6" : "w-8 h-8";
  const padding = isMobile ? "3px 6px 3px 8px" : "4px 8px 4px 12px";

  return (
    <div className={`absolute ${top} ${right} pointer-events-none border-image-`}>
      <div className="flex flex-col gap-2" >
        {activeResources.map((resource) => (
          <div
            key={resource.id}
            className="flex items-center justify-end bg-black/40 rounded-2xl pointer-events-auto gap-1"
            style={{
              padding: padding,
            }}
          >
            <div className="flex-1 ">
              <span className={`${fontSize} text-board text-white flex items-center justify-center leading-none`}>
                {resource.val}
              </span>
            </div>
            <img src={resource.icon} alt={resource.id} className={`${iconSize} object-contain`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourcesOverlay;
