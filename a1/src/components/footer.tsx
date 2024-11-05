export default function Footer() {
	return (
		<footer className="bg-white text-black py-4">
			<div className="container mx-auto px-4">
				<p className="text-center text-sm">
					© {new Date().getFullYear()} A1 Remote
				</p>
			</div>
		</footer>
	);
}
