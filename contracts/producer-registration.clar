;; Producer Registration Contract
;; Records details of fiber farmers and processors

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u403))
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-ALREADY-EXISTS (err u409))

;; Data structures
(define-map producers
  { producer-id: uint }
  {
    owner: principal,
    name: (string-ascii 100),
    producer-type: (string-ascii 50), ;; "farmer", "processor", "artisan", etc.
    materials: (string-ascii 200), ;; "wool", "cotton", "flax", etc.
    location: (string-ascii 200),
    capacity: uint,
    certifications: (string-ascii 500),
    contact-info: (string-ascii 200),
    registration-date: uint,
    verification-status: bool
  }
)

(define-map verifiers
  { address: principal }
  { is-verifier: bool }
)

(define-data-var last-producer-id uint u0)

;; Public functions
(define-public (register-producer
                (name (string-ascii 100))
                (producer-type (string-ascii 50))
                (materials (string-ascii 200))
                (location (string-ascii 200))
                (capacity uint)
                (certifications (string-ascii 500))
                (contact-info (string-ascii 200)))
  (let ((new-id (+ (var-get last-producer-id) u1)))
    (var-set last-producer-id new-id)
    (map-set producers
      { producer-id: new-id }
      {
        owner: tx-sender,
        name: name,
        producer-type: producer-type,
        materials: materials,
        location: location,
        capacity: capacity,
        certifications: certifications,
        contact-info: contact-info,
        registration-date: block-height,
        verification-status: false
      }
    )
    (ok new-id)
  )
)

(define-public (update-producer
                (producer-id uint)
                (name (string-ascii 100))
                (producer-type (string-ascii 50))
                (materials (string-ascii 200))
                (location (string-ascii 200))
                (capacity uint)
                (certifications (string-ascii 500))
                (contact-info (string-ascii 200)))
  (match (map-get? producers { producer-id: producer-id })
    producer
      (if (is-eq tx-sender (get owner producer))
        (begin
          (map-set producers
            { producer-id: producer-id }
            (merge producer {
              name: name,
              producer-type: producer-type,
              materials: materials,
              location: location,
              capacity: capacity,
              certifications: certifications,
              contact-info: contact-info
            })
          )
          (ok producer-id)
        )
        ERR-NOT-AUTHORIZED
      )
    ERR-NOT-FOUND
  )
)

(define-public (add-verifier (verifier principal))
  (if (is-eq tx-sender contract-caller)
    (begin
      (map-set verifiers { address: verifier } { is-verifier: true })
      (ok true)
    )
    ERR-NOT-AUTHORIZED
  )
)

(define-public (verify-producer (producer-id uint) (verified bool))
  (match (map-get? verifiers { address: tx-sender })
    verifier
      (if (get is-verifier verifier)
        (match (map-get? producers { producer-id: producer-id })
          producer
            (begin
              (map-set producers
                { producer-id: producer-id }
                (merge producer { verification-status: verified })
              )
              (ok producer-id)
            )
          ERR-NOT-FOUND
        )
        ERR-NOT-AUTHORIZED
      )
    ERR-NOT-AUTHORIZED
  )
)

;; Read-only functions
(define-read-only (get-producer (producer-id uint))
  (map-get? producers { producer-id: producer-id })
)

(define-read-only (is-producer-verified (producer-id uint))
  (match (map-get? producers { producer-id: producer-id })
    producer (ok (get verification-status producer))
    (err u404)
  )
)

(define-read-only (get-last-producer-id)
  (var-get last-producer-id)
)
