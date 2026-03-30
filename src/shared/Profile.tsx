

export default function Profile({ name, currentName, userColor, senderColor }: { name: string, currentName: string, userColor: string, senderColor: string}) {
  const isMe = currentName === name;
  const currentUserName = currentName.charAt(0).toUpperCase()
  const senderName = name.charAt(0).toUpperCase()
  const color = isMe ? userColor : senderColor
  return (
    <div className={`flex items-center gap-3 mb-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      <div className="relative w-10 h-10 rounded-xl flex items-center justify-center text-md font-black text-white shadow-2xl transition-all duration-500" style={{ backgroundColor: color, boxShadow: `0 20px 50px -10px ${color}66` }}>
        {isMe ? currentUserName : senderName}
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