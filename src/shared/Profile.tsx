import a from '../assets/a.jpeg'
import b from '../assets/b.jpeg'
import c from '../assets/c.jpeg'
import d from '../assets/d.jpeg'
import e from '../assets/e.jpeg'
import f from '../assets/f.jpeg'
import g from '../assets/g.jpeg'
import h from '../assets/h.jpeg'
import i from '../assets/i.jpeg'
import { getRandomInt } from './helper'


const profiles = [a, b, c, d, e, f, g, h, i];
export const randomizedProfile = () => {
  const size = profiles.length;
  const randomIndex = getRandomInt(size);
  return profiles[randomIndex];
};

export default function Profile({ name, profile, currentName }: { name: string, profile: any, currentName: string }) {
  const isMe = currentName === name;
  
  return (
    <div className={`flex items-center gap-3 mb-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      <div className="relative">
        <img 
          className='h-10 w-10 rounded-xl ring-2 ring-slate-800 object-cover shadow-md transition-transform hover:scale-110' 
          src={profile} 
          alt={name} 
        />
        <span className="absolute -bottom-1 -right-1 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-[#111827]"></span>
      </div>
      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        <p className="text-xs font-bold text-slate-300 tracking-wide">
          {isMe ? "You" : name}
        </p>
        <span className="text-[9px] text-slate-500 font-medium uppercase">Active Now</span>
      </div>
    </div>
  );
}